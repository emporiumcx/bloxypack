const User = require('../../database/models/User');
const UserSeed = require('../../database/models/UserSeed');
const Leaderboard = require('../../database/models/Leaderboard');
const Rain = require('../../database/models/Rain');
const DiceBet = require('../../database/models/DiceBet');
const { socketRemoveAntiSpam } = require('../../utils/socket');
const { settingGet } = require('../../utils/setting');
const { diceCheckSendBetData, diceMultiplier, diceRoll } = require('../../utils/dice');
const { generalUserGetRakeback, generalUserGetFormated } = require('../../utils/general/user');
const { generalAddBetsList } = require('../general/bets');

const diceSendBetSocket = async (io, socket, user, data, callback) => {
    try {
        diceCheckSendBetData(data);
        if (user.balance < Math.floor(data.amount)) {
            throw new Error('You don’t have enough balance for this action.');
        }

        const seedDatabase = await UserSeed.findOne({ user: user._id, state: 'active' }).select('seedClient seedServer nonce user state');
        if (!seedDatabase) throw new Error('You need to generate a server seed first.');

        const amount = Math.floor(data.amount);
        const target = Number(data.target);
        const rollOver = data.rollOver === true;
        const roll = diceRoll(seedDatabase);
        const won = rollOver ? roll > target * 100 : roll < target * 100;
        const multiplier = diceMultiplier(rollOver, target);
        const payout = won ? Math.floor(amount * multiplier) : 0;

        const leaderboardDatabase = await Leaderboard.findOne({ state: 'running' }).select('state').lean();
        const settings = settingGet();
        const rakeback = generalUserGetRakeback(user);
        const amountRakeback = user.limits.blockSponsor !== true ? Math.floor(amount * rakeback.percentage * settings.general.reward.multiplier) : 0;
        const amountAffiliate = user.affiliates.referrer !== undefined && user.limits.blockSponsor !== true ? Math.floor(amount * 0.005) : 0;

        const [userDatabase] = await Promise.all([
            User.findByIdAndUpdate(user._id, {
                $inc: {
                    balance: payout - amount,
                    xp: user.limits.blockSponsor !== true ? Math.floor(amount * settings.general.reward.multiplier) : 0,
                    'rewards.bonusXp': user.limits.blockSponsor !== true ? Math.floor(amount * settings.general.reward.multiplier) : 0,
                    'stats.bet': amount,
                    'stats.won': payout,
                    'leaderboard.points': leaderboardDatabase !== null && user.limits.blockSponsor !== true && user.limits.blockLeaderboard !== true ? amount : 0,
                    'affiliates.generated': amountAffiliate,
                    'rakeback.earned': amountRakeback,
                    'rakeback.available': amountRakeback
                },
                updatedAt: Date.now()
            }, { new: true }).select('username avatar rank balance xp stats local.email rakeback mute ban verifiedAt updatedAt').lean(),
            UserSeed.findByIdAndUpdate(seedDatabase._id, { $inc: { nonce: 1 } }, {}),
            Rain.findOneAndUpdate(
                { type: 'site', $or: [{ state: 'created' }, { state: 'pending' }, { state: 'running' }] },
                { $inc: { amount: Math.floor(amount * 0.001) } },
                { new: true }
            ),
            DiceBet.create({
                amount,
                payout,
                multiplier: won ? multiplier : 0,
                user: user._id
            })
        ]);

        const bet = {
            user: generalUserGetFormated({ ...user, ...userDatabase }),
            amount,
            payout,
            multiplier: won ? multiplier : 0,
            game: 'dice',
            method: 'dice'
        };
        try { generalAddBetsList(io, bet); } catch (e) {}

        callback({
            success: true,
            user: userDatabase,
            game: {
                roll,
                won,
                payout,
                multiplier,
                target,
                rollOver,
                fair: { seedClient: seedDatabase.seedClient, nonce: seedDatabase.nonce, hash: seedDatabase.hash }
            }
        });
        socketRemoveAntiSpam(user._id);
    } catch (err) {
        socketRemoveAntiSpam(socket.decoded._id);
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
};

module.exports = { diceSendBetSocket };
