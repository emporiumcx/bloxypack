const crypto = require('crypto');

const User = require('../../database/models/User');
const RouletteGame = require('../../database/models/RouletteGame');
const RouletteSeed = require('../../database/models/RouletteSeed');
const RouletteBet = require('../../database/models/RouletteBet');
const Rain = require('../../database/models/Rain');
const Leaderboard = require('../../database/models/Leaderboard');
const { socketRemoveAntiSpam } = require('../../utils/socket');
const { settingGet } = require('../../utils/setting');
const { generalUserGetLevel, generalUserGetRakeback, generalUserGetFormated } = require('../../utils/general/user');
const { generalAddBetsList } = require('../general/bets');
const {
    BET_MS,
    SPIN_MS,
    COOLDOWN_MS,
    hashServerSeed,
    rouletteColor,
    rouletteMultiplier,
    rouletteRoll,
    rouletteSanitizeGame,
    rouletteSanitizeBet,
    rouletteCheckBet
} = require('../../utils/roulette');

let rouletteGame = null;
let rouletteBets = [];
let rouletteHistory = [];
let pendingBets = 0;
let roundEndsAt = 0;

const rouletteGetData = () => ({
    game: rouletteSanitizeGame(rouletteGame, { endsAt: roundEndsAt }),
    bets: rouletteBets.map(rouletteSanitizeBet),
    history: rouletteHistory
});

const rouletteSendBetSocket = async (io, socket, user, data, callback) => {
    try {
        rouletteCheckBet(data, user, rouletteGame);
        pendingBets += 1;
        try {
            const amount = Math.floor(data.amount);
            const color = data.color;
            const multiplier = rouletteMultiplier(color);
            const level = generalUserGetLevel(user);
            const rakeback = generalUserGetRakeback(user);

            const [userDatabase, betDatabase] = await Promise.all([
                User.findByIdAndUpdate(user._id, {
                    $inc: { balance: -amount, 'stats.bet': amount },
                    updatedAt: Date.now()
                }, { new: true }).select('balance xp stats rakeback mute ban verifiedAt updatedAt').lean(),
                RouletteBet.create({
                    amount,
                    color,
                    multiplier,
                    game: rouletteGame._id,
                    user: user._id
                })
            ]);

            const bet = betDatabase.toObject();
            bet.user = {
                _id: user._id,
                username: user.username,
                avatar: user.avatar,
                rank: user.rank,
                xp: user.xp,
                level,
                rakeback,
                affiliates: user.affiliates,
                stats: user.stats,
                limits: user.limits,
                createdAt: user.createdAt
            };
            rouletteBets.push(bet);
            io.of('/roulette').emit('bet', { bet: rouletteSanitizeBet(bet) });
            callback({ success: true, user: userDatabase });
            pendingBets = Math.max(0, pendingBets - 1);
            socketRemoveAntiSpam(user._id);
        } catch (err) {
            pendingBets = Math.max(0, pendingBets - 1);
            socketRemoveAntiSpam(socket.decoded._id);
            callback({ success: false, error: { type: 'error', message: err.message } });
        }
    } catch (err) {
        socketRemoveAntiSpam(socket.decoded._id);
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
};

const rouletteGameStart = async (io) => {
    try {
        rouletteBets = [];
        const seedPublic = crypto.randomBytes(8).toString('hex');
        const seedServer = crypto.randomBytes(24).toString('hex');
        const hash = hashServerSeed(seedServer);
        const seed = await RouletteSeed.create({
            seedPublic,
            seedServer,
            hash,
            state: 'created'
        });
        const created = await RouletteGame.create({
            fair: { seed: seed._id },
            state: 'created'
        });
        rouletteGame = created.toObject();
        rouletteGame.fair.seed = seed.toObject();
        roundEndsAt = Date.now() + BET_MS;
        io.of('/roulette').emit('game', { game: rouletteSanitizeGame(rouletteGame, { endsAt: roundEndsAt }), bets: [] });
        setTimeout(() => rouletteGameValidate(io), BET_MS);
    } catch (err) {
        console.error(err);
        setTimeout(() => rouletteGameStart(io), 3000);
    }
};

const rouletteGameValidate = async (io) => {
    try {
        if (!rouletteGame) return;
        if (pendingBets > 0) {
            setTimeout(() => rouletteGameValidate(io), 250);
            return;
        }
        const seed = rouletteGame.fair.seed;
        const outcome = rouletteRoll(seed.seedServer, seed.seedPublic);
        rouletteGame.outcome = outcome;
        rouletteGame.color = rouletteColor(outcome);
        rouletteGame.state = 'rolling';
        rouletteGame.updatedAt = Date.now();
        roundEndsAt = Date.now() + SPIN_MS;
        await RouletteSeed.findByIdAndUpdate(seed._id, { state: 'completed' });
        io.of('/roulette').emit('game', {
            game: rouletteSanitizeGame(rouletteGame, { endsAt: roundEndsAt }),
            bets: rouletteBets.map(rouletteSanitizeBet)
        });
        setTimeout(() => rouletteGameComplete(io), SPIN_MS);
    } catch (err) {
        console.error(err);
    }
};

const rouletteGameComplete = async (io) => {
    try {
        if (!rouletteGame) return;
        rouletteGame.state = 'completed';
        const settings = settingGet();
        const leaderboard = await Leaderboard.findOne({ state: 'running' }).select('state').lean();
        const userUpdates = [];
        const affiliateUpdates = [];
        const betUpdates = [];
        let rainAmount = 0;

        for (const bet of rouletteBets) {
            const won = bet.color === rouletteGame.color;
            const payout = won ? Math.floor(bet.amount * bet.multiplier) : 0;
            const rakebackPct = bet.user.rakeback && bet.user.rakeback.percentage ? bet.user.rakeback.percentage : 0;
            const amountRakeback = bet.user.limits && bet.user.limits.blockSponsor !== true
                ? Math.floor(bet.amount * rakebackPct * settings.general.reward.multiplier)
                : 0;
            const amountAffiliate = bet.user.affiliates && bet.user.affiliates.referrer && bet.user.limits && bet.user.limits.blockSponsor !== true
                ? Math.floor(bet.amount * 0.005)
                : 0;
            rainAmount += bet.user.limits && bet.user.limits.blockSponsor !== true ? bet.amount : 0;

            userUpdates.push(
                User.findByIdAndUpdate(bet.user._id, {
                    $inc: {
                        balance: payout,
                        xp: bet.user.limits && bet.user.limits.blockSponsor !== true ? Math.floor(bet.amount * settings.general.reward.multiplier) : 0,
                        'rewards.bonusXp': bet.user.limits && bet.user.limits.blockSponsor !== true ? Math.floor(bet.amount * settings.general.reward.multiplier) : 0,
                        'stats.won': payout,
                        'leaderboard.points': leaderboard && bet.user.limits && bet.user.limits.blockSponsor !== true && bet.user.limits.blockLeaderboard !== true ? bet.amount : 0,
                        'rakeback.earned': amountRakeback,
                        'rakeback.available': amountRakeback,
                        'affiliates.generated': amountAffiliate
                    },
                    updatedAt: Date.now()
                }, { new: true }).select('balance xp stats rakeback mute ban verifiedAt updatedAt').lean()
            );

            if (bet.user.affiliates && bet.user.affiliates.referrer && amountAffiliate > 0) {
                affiliateUpdates.push(
                    User.findByIdAndUpdate(bet.user.affiliates.referrer, {
                        $inc: { 'affiliates.earned': amountAffiliate, 'affiliates.available': amountAffiliate },
                        updatedAt: Date.now()
                    }, {})
                );
            }

            betUpdates.push(
                RouletteBet.findByIdAndUpdate(bet._id, { payout, updatedAt: Date.now() }, { new: true })
                    .select('amount payout color multiplier user')
                    .populate({ path: 'user', select: 'username avatar rank xp stats anonymous createdAt' })
                    .lean()
            );
            bet.payout = payout;
        }

        const saved = await RouletteGame.findByIdAndUpdate(rouletteGame._id, {
            outcome: rouletteGame.outcome,
            color: rouletteGame.color,
            state: 'completed',
            updatedAt: Date.now()
        }, { new: true }).lean();

        const rain = await Rain.findOneAndUpdate(
            { type: 'site', $or: [{ state: 'created' }, { state: 'pending' }, { state: 'running' }] },
            { $inc: { amount: Math.floor(rainAmount * 0.001) } },
            { new: true }
        ).select('amount participants type state updatedAt').lean();

        const users = await Promise.all(userUpdates);
        await Promise.all(affiliateUpdates);
        const bets = await Promise.all(betUpdates);

        rouletteHistory = [
            { outcome: rouletteGame.outcome, color: rouletteGame.color, _id: rouletteGame._id },
            ...rouletteHistory
        ].slice(0, 40);

        io.of('/roulette').emit('game', {
            game: rouletteSanitizeGame(rouletteGame, { endsAt: Date.now() + COOLDOWN_MS }),
            bets: rouletteBets.map(rouletteSanitizeBet),
            history: rouletteHistory
        });
        if (rain) io.of('/general').emit('rain', { rain });
        for (const user of users) {
            if (user && user._id) io.of('/general').to(user._id.toString()).emit('user', { user });
        }
        for (const bet of bets) {
            try {
                generalAddBetsList(io, { ...bet, user: generalUserGetFormated(bet.user), method: 'roulette', multiplier: bet.payout > 0 ? bet.multiplier : 0 });
            } catch (e) {}
        }

        void saved;
        setTimeout(() => rouletteGameStart(io), COOLDOWN_MS);
    } catch (err) {
        console.error(err);
        setTimeout(() => rouletteGameStart(io), COOLDOWN_MS);
    }
};

const rouletteInit = async (io) => {
    try {
        const recent = await RouletteGame.find({ state: 'completed' }).sort({ createdAt: -1 }).limit(40).select('outcome color').lean();
        rouletteHistory = recent.map((g) => ({ _id: g._id, outcome: g.outcome, color: g.color || rouletteColor(g.outcome) }));
        await rouletteGameStart(io);
    } catch (err) {
        console.error(err);
        await rouletteGameStart(io);
    }
};

module.exports = {
    rouletteGetData,
    rouletteSendBetSocket,
    rouletteInit
};
