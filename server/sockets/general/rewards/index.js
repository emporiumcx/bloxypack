const User = require('../../../database/models/User');
const { rateLimiter } = require('../../../middleware/rateLimiter');
const {
    socketCheckUserData,
    socketCheckAntiSpam,
    socketRemoveAntiSpam
} = require('../../../utils/socket');
const { settingCheck } = require('../../../utils/setting');
const {
    generalGetRewardsDataSocket,
    generalSendRewardOpenSocket
} = require('../../../controllers/general/rewards');

module.exports = (io, socket) => {
    socket.on('getRewardsData', async (data, callback) => {
        if (callback === undefined || typeof callback !== 'function') return;
        try {
            const identifier = socket.handshake.headers['cf-connecting-ip'] || socket.conn.remoteAddress;
            await rateLimiter.consume(identifier);
            let user = null;
            if (socket.decoded) user = await User.findById(socket.decoded._id).select('username avatar rank xp stats rakeback rewards mute ban').lean();
            socketCheckUserData(user, true);
            settingCheck(user);
            generalGetRewardsDataSocket(io, socket, user, data, callback);
        } catch (err) {
            callback({ success: false, error: { type: 'error', message: err.message } });
        }
    });

    socket.on('sendRewardOpen', async (data, callback) => {
        if (callback === undefined || typeof callback !== 'function') return;
        try {
            const identifier = socket.handshake.headers['cf-connecting-ip'] || socket.conn.remoteAddress;
            await rateLimiter.consume(identifier);
            socketCheckAntiSpam(socket.decoded._id);
            const user = await User.findById(socket.decoded._id).select('username avatar rank xp stats rakeback rewards limits mute ban').lean();
            socketCheckUserData(user, true);
            settingCheck(user);
            generalSendRewardOpenSocket(io, socket, user, data, callback);
        } catch (err) {
            socketRemoveAntiSpam(socket.decoded && socket.decoded._id);
            callback({ success: false, error: { type: 'error', message: err.message } });
        }
    });
};
