const User = require('../../../database/models/User');
const GiveawayWin = require('../../../database/models/GiveawayWin');
const BalanceTransaction = require('../../../database/models/BalanceTransaction');
const {
    generalGetGiveawayStats,
    generalGetGiveawayClaims,
    generalSettleGiveaways
} = require('../../../utils/general/giveaway');
const { pickDrop } = require('../../../utils/general/rewards');
const { socketRemoveAntiSpam } = require('../../../utils/socket');

let giveawayLoop = null;

const generalGetGiveawayDataSocket = async (io, socket, user, data, callback) => {
    try {
        const [giveaways, claims] = await Promise.all([
            generalGetGiveawayStats(user && user._id),
            generalGetGiveawayClaims(user && user._id)
        ]);
        callback({ success: true, giveaways, claims });
    } catch (err) {
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
};

const generalSendGiveawayOpenSocket = async (io, socket, user, data, callback) => {
    try {
        const winId = data && data.winId;
        if (!winId) throw new Error('Your entered giveaway prize is invalid.');

        const win = await GiveawayWin.findOne({
            _id: winId,
            user: user._id,
            state: 'claimable',
            expiresAt: { $gt: new Date() }
        }).lean();
        if (!win) throw new Error('This giveaway pack is no longer available to open.');

        const item = pickDrop(win.slug);
        const payout = Math.floor((Number(item.value) || 0) * 1000);

        const [saved] = await Promise.all([
            User.findByIdAndUpdate(user._id, {
                $inc: { balance: payout, 'stats.won': payout },
                updatedAt: Date.now()
            }, { new: true }).select('balance xp stats rakeback rewards mute ban verifiedAt updatedAt username avatar rank').lean(),
            GiveawayWin.findByIdAndUpdate(win._id, {
                state: 'opened',
                openedAt: new Date()
            }, {}),
            BalanceTransaction.create({
                amount: payout,
                type: 'giveawayCase',
                user: user._id,
                state: 'completed'
            })
        ]);

        callback({
            success: true,
            user: saved,
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

const generalGiveawayInit = () => {
    if (giveawayLoop) return;
    const tick = () => {
        generalSettleGiveaways().catch((err) => console.error(err));
    };
    tick();
    giveawayLoop = setInterval(tick, 30000);
};

module.exports = {
    generalGetGiveawayDataSocket,
    generalSendGiveawayOpenSocket,
    generalGiveawayInit
};
