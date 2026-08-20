const User = require('../../../database/models/User');
const BalanceTransaction = require('../../../database/models/BalanceTransaction');
const {
    generalUserGetLevel
} = require('../../../utils/general/user');
const {
    BONUS_CASES,
    DAILY_CASES,
    RANK_CASES,
    displayXp,
    pickDrop,
    findCase,
    normalizeRewards
} = require('../../../utils/general/rewards');
const {
    socketRemoveAntiSpam
} = require('../../../utils/socket');

const publicRewards = (user) => {
    const level = generalUserGetLevel(user);
    const rewards = normalizeRewards(user, level);
    return {
        bonusXp: displayXp(rewards.bonusXp),
        dailyDate: rewards.dailyDate,
        dailyOpened: rewards.dailyOpened,
        rankKeys: rewards.rankKeys,
        rakeback: Math.floor((user.rakeback && user.rakeback.available) || 0)
    };
};

const persistNormalized = async (user, rewards) => {
    return User.findByIdAndUpdate(user._id, {
        rewards,
        updatedAt: Date.now()
    }, { new: true }).select('balance xp stats rakeback rewards mute ban verifiedAt updatedAt username avatar rank').lean();
};

const generalGetRewardsDataSocket = async (io, socket, user, data, callback) => {
    try {
        const level = generalUserGetLevel(user);
        const rewards = normalizeRewards(user, level);
        const saved = await persistNormalized(user, rewards);
        callback({ success: true, rewards: publicRewards(saved), user: saved });
    } catch (err) {
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
};

const generalSendRewardOpenSocket = async (io, socket, user, data, callback) => {
    try {
        const slug = data && data.slug;
        const box = findCase(slug);
        if (!box) throw new Error('Your entered reward case is invalid.');

        const level = generalUserGetLevel(user);
        const rewards = normalizeRewards(user, level);

        if (box.kind === 'bonus') {
            if (displayXp(rewards.bonusXp) < box.xp) {
                throw new Error(`You need ${box.xp.toLocaleString('en-US')} bonus XP to open this case.`);
            }
            rewards.bonusXp = 0;
        } else if (box.kind === 'daily') {
            if (level < box.level) throw new Error(`Reach level ${box.level} to unlock this daily case.`);
            if (rewards.dailyOpened.includes(box.slug)) throw new Error('You already opened this daily case today.');
            rewards.dailyOpened.push(box.slug);
        } else if (box.kind === 'rank') {
            if (level < box.level) throw new Error('You have not unlocked this rank case yet.');
            const keys = Math.max(0, Number(rewards.rankKeys[box.slug] || 0));
            if (keys < 1) throw new Error('You have no keys for this rank case.');
            rewards.rankKeys[box.slug] = keys - 1;
        }

        const item = pickDrop(box.slug);
        const payout = Math.floor((Number(item.value) || 0) * 1000);

        const [saved] = await Promise.all([
            User.findByIdAndUpdate(user._id, {
                $inc: { balance: payout, 'stats.won': payout },
                rewards,
                updatedAt: Date.now()
            }, { new: true }).select('balance xp stats rakeback rewards mute ban verifiedAt updatedAt username avatar rank').lean(),
            BalanceTransaction.create({
                amount: payout,
                type: 'rewardCase',
                user: user._id,
                state: 'completed'
            })
        ]);

        callback({
            success: true,
            user: saved,
            rewards: publicRewards(saved),
            games: [{
                ticket: item.minTicket,
                item: {
                    name: item.name,
                    image: `/cdn/items/${item.id}.webp`,
                    amountFixed: payout,
                    color: item.color,
                    dropId: item.id
                }
            }]
        });

        io.of('/general').to(user._id.toString()).emit('user', { user: saved });
        socketRemoveAntiSpam(user._id);
    } catch (err) {
        socketRemoveAntiSpam(socket.decoded._id);
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
};

module.exports = {
    generalGetRewardsDataSocket,
    generalSendRewardOpenSocket,
    BONUS_CASES,
    DAILY_CASES,
    RANK_CASES
};
