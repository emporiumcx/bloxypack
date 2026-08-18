const User = require('../../database/models/User');
const { rateLimiter } = require('../../middleware/rateLimiter');
const {
    socketCheckUserData,
    socketCheckConnectionLimit,
    socketSetConnectionAuth,
    socketAddConnectionLimit,
    socketRemoveConnectionLimit,
    socketCheckAntiSpam,
    socketRemoveAntiSpam
} = require('../../utils/socket');
const { settingCheck } = require('../../utils/setting');
const { rouletteGetData, rouletteSendBetSocket, rouletteInit } = require('../../controllers/roulette');

module.exports = (io) => {
    io.of('/roulette').use(async (socket, next) => {
        try {
            const identifier = socket.handshake.headers['cf-connecting-ip'] || socket.conn.remoteAddress;
            await socketCheckConnectionLimit('roulette', identifier);
            try {
                await socketSetConnectionAuth(socket, false);
            } catch (err) {
                next(err);
            }
            socket.emit('init', rouletteGetData());
            next();
        } catch (err) {
            return next({ success: false, error: { type: 'error', message: err.message } });
        }
    });

    io.of('/roulette').on('connection', (socket) => {
        const identifier = socket.handshake.headers['cf-connecting-ip'] || socket.conn.remoteAddress;
        socketAddConnectionLimit('roulette', identifier);

        socket.on('sendBet', async (data, callback) => {
            if (callback === undefined || typeof callback !== 'function') return;
            if (socket.decoded !== undefined && socket.decoded !== null) {
                try {
                    await rateLimiter.consume(identifier);
                    await socketCheckAntiSpam(socket.decoded._id);
                    try {
                        const user = await User.findById(socket.decoded._id).select('username avatar rank balance xp stats limits affiliates anonymous mute ban createdAt').lean();
                        socketCheckUserData(user, true);
                        try { settingCheck(user, 'games.roulette.enabled'); } catch (e) { settingCheck(user, 'games.roll.enabled'); }
                        rouletteSendBetSocket(io, socket, user, data, callback);
                    } catch (err) {
                        socketRemoveAntiSpam(socket.decoded._id);
                        callback({ success: false, error: { type: 'error', message: err.message } });
                    }
                } catch (err) {
                    callback({ success: false, error: { type: 'error', message: err.message !== undefined ? err.message : 'You need to slow down, you have send to many request. Try again in a minute.' } });
                }
            } else {
                callback({ success: false, error: { type: 'error', message: 'You need to sign in to perform this action.' } });
            }
        });

        socket.on('disconnect', () => {
            socketRemoveConnectionLimit('roulette', identifier);
        });
    });

    rouletteInit(io);
};
