const User = require('../../database/models/User');
const UserSeed = require('../../database/models/UserSeed');
const Leaderboard = require('../../database/models/Leaderboard');
const Rain = require('../../database/models/Rain');
const { socketRemoveAntiSpam } = require('../../utils/socket');
const { settingGet } = require('../../utils/setting');
const {
    blackjackSoloCheckBet,
    blackjackSoloShuffle,
    blackjackSoloTotal,
    blackjackSoloPayout,
    blackjackSoloDraw
} = require('../../utils/blackjack-solo');
const { generalUserGetRakeback, generalUserGetFormated } = require('../../utils/general/user');
const { generalAddBetsList } = require('../general/bets');

let soloGames = [];

const findSolo = (userId) => soloGames.find((g) => g.user.toString() === userId.toString());

const publicCards = (cards, hideHole) =>
    cards.map((c, i) => (hideHole && i === 1 ? { hidden: true } : c));

const settle = async (io, user, game, instantBlackjack) => {
    if (!instantBlackjack) {
        while (blackjackSoloTotal(game.dealer) < 17) {
            game.dealer.push(blackjackSoloDraw(game));
        }
    }
    const payout = blackjackSoloPayout(game.amount, game.player, game.dealer);
    const amount = game.amount;
    const settings = settingGet();
    const leaderboardDatabase = await Leaderboard.findOne({ state: 'running' }).select('state').lean();
    const rakeback = generalUserGetRakeback(user);
    const amountRakeback = user.limits.blockSponsor !== true ? Math.floor(amount * rakeback.percentage * settings.general.reward.multiplier) : 0;
    const amountAffiliate = user.affiliates && user.affiliates.referrer !== undefined && user.limits.blockSponsor !== true ? Math.floor(amount * 0.005) : 0;

    const userDatabase = await User.findByIdAndUpdate(user._id, {
        $inc: {
            balance: payout,
            xp: user.limits.blockSponsor !== true ? Math.floor(amount * settings.general.reward.multiplier) : 0,
            'stats.bet': amount,
            'stats.won': payout,
            'leaderboard.points': leaderboardDatabase !== null && user.limits.blockSponsor !== true && user.limits.blockLeaderboard !== true ? amount : 0,
            'affiliates.generated': amountAffiliate,
            'rakeback.earned': amountRakeback,
            'rakeback.available': amountRakeback
        },
        updatedAt: Date.now()
    }, { new: true }).select('username avatar rank balance xp stats local.email rakeback mute ban verifiedAt updatedAt').lean();

    try {
        generalAddBetsList(io, {
            user: generalUserGetFormated({ ...user, ...userDatabase }),
            amount,
            payout,
            multiplier: payout > 0 ? payout / amount : 0,
            game: 'blackjack',
            method: 'blackjack'
        });
    } catch (e) {}

    soloGames = soloGames.filter((g) => g.user.toString() !== user._id.toString());
    return { user: userDatabase, payout, player: game.player, dealer: game.dealer, state: 'completed' };
};

const blackjackSoloBet = async (io, socket, user, data, callback) => {
    try {
        blackjackSoloCheckBet(data);
        if (findSolo(user._id)) throw new Error('You need to complete your running blackjack game first.');
        const amount = Math.floor(data.amount);
        if (user.balance < amount) throw new Error('You don’t have enough balance for this action.');

        const seedDatabase = await UserSeed.findOne({ user: user._id, state: 'active' }).select('seedClient seedServer nonce user state');
        if (!seedDatabase) throw new Error('You need to generate a server seed first.');

        const deck = blackjackSoloShuffle(seedDatabase);
        const game = { user: user._id, amount, deck, cursor: 0, player: [], dealer: [] };
        game.player.push(blackjackSoloDraw(game));
        game.dealer.push(blackjackSoloDraw(game));
        game.player.push(blackjackSoloDraw(game));
        game.dealer.push(blackjackSoloDraw(game));
        soloGames.push(game);

        const [userDatabase] = await Promise.all([
            User.findByIdAndUpdate(user._id, {
                $inc: { balance: -amount },
                updatedAt: Date.now()
            }, { new: true }).select('balance xp stats rakeback mute ban verifiedAt updatedAt').lean(),
            UserSeed.findByIdAndUpdate(seedDatabase._id, { $inc: { nonce: 1 } }, {}),
            Rain.findOneAndUpdate(
                { type: 'site', $or: [{ state: 'created' }, { state: 'pending' }, { state: 'running' }] },
                { $inc: { amount: Math.floor(amount * 0.001) } },
                { new: true }
            )
        ]);

        if (blackjackSoloTotal(game.player) === 21) {
            const settled = await settle(io, { ...user, ...userDatabase }, game, true);
            callback({ success: true, user: settled.user, game: settled });
        } else {
            callback({
                success: true,
                user: userDatabase,
                game: {
                    player: game.player,
                    dealer: publicCards(game.dealer, true),
                    state: 'live'
                }
            });
        }
        socketRemoveAntiSpam(user._id);
    } catch (err) {
        socketRemoveAntiSpam(socket.decoded._id);
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
};

const blackjackSoloHit = async (io, socket, user, data, callback) => {
    try {
        const game = findSolo(user._id);
        if (!game) throw new Error('You have no running blackjack game at the moment.');
        game.player.push(blackjackSoloDraw(game));
        if (blackjackSoloTotal(game.player) >= 21) {
            const settled = await settle(io, user, game, false);
            callback({ success: true, user: settled.user, game: settled });
        } else {
            callback({
                success: true,
                user,
                game: { player: game.player, dealer: publicCards(game.dealer, true), state: 'live' }
            });
        }
        socketRemoveAntiSpam(user._id);
    } catch (err) {
        socketRemoveAntiSpam(socket.decoded._id);
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
};

const blackjackSoloStand = async (io, socket, user, data, callback) => {
    try {
        const game = findSolo(user._id);
        if (!game) throw new Error('You have no running blackjack game at the moment.');
        const settled = await settle(io, user, game, false);
        callback({ success: true, user: settled.user, game: settled });
        socketRemoveAntiSpam(user._id);
    } catch (err) {
        socketRemoveAntiSpam(socket.decoded._id);
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
};

const blackjackSoloDouble = async (io, socket, user, data, callback) => {
    try {
        const game = findSolo(user._id);
        if (!game) throw new Error('You have no running blackjack game at the moment.');
        if (game.player.length !== 2) throw new Error('You can only double on your first two cards.');
        if (user.balance < game.amount) throw new Error('You don’t have enough balance for this action.');

        const userDatabase = await User.findByIdAndUpdate(user._id, {
            $inc: { balance: -game.amount },
            updatedAt: Date.now()
        }, { new: true }).select('username avatar rank balance xp stats local.email rakeback mute ban verifiedAt updatedAt').lean();

        game.amount = game.amount * 2;
        game.player.push(blackjackSoloDraw(game));
        const settled = await settle(io, { ...user, ...userDatabase }, game, false);
        callback({ success: true, user: settled.user, game: settled });
        socketRemoveAntiSpam(user._id);
    } catch (err) {
        socketRemoveAntiSpam(socket.decoded._id);
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
};

module.exports = {
    blackjackSoloBet,
    blackjackSoloHit,
    blackjackSoloStand,
    blackjackSoloDouble
};
