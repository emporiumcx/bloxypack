const User = require('../../../database/models/User');
const Rain = require('../../../database/models/Rain');
const BalanceTransaction = require('../../../database/models/BalanceTransaction');

const {
    socketRemoveAntiSpam
} = require('../../../utils/socket');
const {
    settingGet
} = require('../../../utils/setting');
const {
    captchaCheckData,
    captchaGetData
} = require('../../../utils/captcha');
const {
    RAIN_WAGER_WINDOW_MS,
    RAIN_SITE_SEED,
    generalRainDuration,
    generalRainPublic,
    generalGetUserWagerSince,
    generalCheckSendRainCreateData,
    generalCheckSendRainCreateRain,
    generalCheckSendRainCreateUser,
    generalCheckSendRainTipData,
    generalCheckSendRainTipRain,
    generalCheckSendRainTipUser,
    generalCheckSendRainJoinData,
    generalCheckSendRainJoinRain,
    generalCheckSendRainJoinUser,
    generalCheckSendRainJoinWager
} = require('../../../utils/general/rain');
const {
    generalUserGetFormated
} = require('../../../utils/general/user');
const {
    generalChatAddMessage
} = require('../chat');

let generalRainCreateBlock = [];

const emitRain = (io, rain) => {
    io.of('/general').emit('rain', { rain: generalRainPublic(rain) });
};

const generalGetRains = () => {
    return new Promise(async(resolve, reject) => {
        try {
            let dataDatabase = await Promise.all([
                Rain.findOne({ type: 'site', $or: [{ state: 'created' }, { state: 'pending' }, { state: 'running' }] }).select('amount participants type state updatedAt createdAt').lean(),
                Rain.findOne({ state: 'running' }).select('amount participants creator type state updatedAt createdAt').populate({ path: 'creator', select: 'username avatar rank xp stats anonymous createdAt' }).lean()
            ]);

            if(dataDatabase[1] !== null && dataDatabase[1].type === 'user') {
                dataDatabase[1].creator = generalUserGetFormated(dataDatabase[1].creator);
            }

            resolve({ site: generalRainPublic(dataDatabase[0]), active: generalRainPublic(dataDatabase[1]) });
        } catch(err) {
            reject(err);
        }
    });
}

const generalSendRainCreateSocket = async(io, socket, user, data, callback) => {
    try {
        generalCheckSendRainCreateData(data);

        const rainDatabase = await Rain.findOne({ type: 'user', $or: [{ state: 'created' }, { state: 'pending' }, { state: 'running' }] }).select('type state createdAt').lean();
        generalCheckSendRainCreateRain(rainDatabase, generalRainCreateBlock);

        try {
            generalRainCreateBlock.push(user._id.toString());

            generalCheckSendRainCreateUser(data, user);

            const amount = Math.floor(data.amount);

            let dataDatabase = await Promise.all([
                User.findByIdAndUpdate(user._id, {
                    $inc: {
                        balance: -amount
                    },
                    updatedAt: new Date().getTime()
                }, { new: true }).select('balance xp stats rakeback mute ban verifiedAt updatedAt').lean(),
                Rain.create({
                    amount: amount,
                    creator: user._id,
                    type: 'user',
                    state: 'created'
                }),
                BalanceTransaction.create({
                    amount: -amount,
                    type: 'rainCreate',
                    user: user._id,
                    state: 'completed'
                })
            ]);

            dataDatabase[1] = dataDatabase[1].toObject();

            io.of('/general').to(user._id.toString()).emit('user', { user: dataDatabase[0] });

            generalRainStart(io, dataDatabase[1]);

            callback({ success: true });

            generalRainCreateBlock.splice(generalRainCreateBlock.indexOf(user._id.toString()), 1);

            socketRemoveAntiSpam(user._id);
        } catch(err) {
            generalRainCreateBlock.splice(generalRainCreateBlock.indexOf(user._id.toString()), 1);
            socketRemoveAntiSpam(socket.decoded._id);
            callback({ success: false, error: { type: 'error', message: err.message } });
        }
    } catch(err) {
        socketRemoveAntiSpam(socket.decoded._id);
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
}

const generalSendRainTipSocket = async(io, socket, user, data, callback) => {
    try {
        generalCheckSendRainTipData(data);

        const rainDatabase = await Rain.findOne({ type: 'site', $or: [{ state: 'created' }, { state: 'pending' }, { state: 'running' }] }).select('type state').lean();
        generalCheckSendRainTipRain(rainDatabase);

        generalCheckSendRainTipUser(data, user);

        const amount = Math.floor(data.amount);

        let dataDatabase = await Promise.all([
            User.findByIdAndUpdate(user._id, {
                $inc: {
                    balance: -amount
                },
                updatedAt: new Date().getTime()
            }, { new: true }).select('balance xp stats rakeback mute ban verifiedAt updatedAt').lean(),
            Rain.findByIdAndUpdate(rainDatabase._id, {
                $inc: {
                    amount: amount
                }
            }, { new: true }).select('amount participants type state updatedAt createdAt').lean(),
            BalanceTransaction.create({
                amount: -amount,
                type: 'rainTip',
                user: user._id,
                state: 'completed'
            })
        ]);

        dataDatabase[2] = dataDatabase[2].toObject();
        dataDatabase[2].user = { _id: user._id, username: user.username };

        io.of('/general').to(user._id.toString()).emit('user', { user: dataDatabase[0] });
        emitRain(io, dataDatabase[1]);

        generalChatAddMessage(io, {
            transaction: dataDatabase[2],
            type: 'rainTip'
        });

        callback({ success: true });

        socketRemoveAntiSpam(user._id);
    } catch(err) {
        socketRemoveAntiSpam(socket.decoded._id);
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
}

const generalSendRainJoinSocket = async(io, socket, user, data, callback) => {
    try {
        generalCheckSendRainJoinData(data);

        if (data && data.captcha) {
            const captchaCheck = await captchaGetData(data.captcha);
            captchaCheckData(captchaCheck);
        }

        const rainDatabase = await Rain.findOne({ state: 'running' }).select('amount participants type state updatedAt createdAt').lean();
        const settings = settingGet();

        generalCheckSendRainJoinRain(user, rainDatabase, settings);
        generalCheckSendRainJoinUser(user);

        const wager = await generalGetUserWagerSince(user._id, new Date(Date.now() - RAIN_WAGER_WINDOW_MS));
        generalCheckSendRainJoinWager(wager, rainDatabase);

        const updated = await Rain.findByIdAndUpdate(rainDatabase._id, {
            $push: { participants: { user: user._id, wager } }
        }, { new: true }).select('amount participants creator type state updatedAt createdAt').populate({ path: 'creator', select: 'username' }).lean();

        emitRain(io, updated);

        callback({ success: true });

        socketRemoveAntiSpam(user._id);
    } catch(err) {
        socketRemoveAntiSpam(socket.decoded._id);
        callback({ success: false, error: { type: 'error', message: err.message } });
    }
}

const generalRainStart = async(io, rain) => {
    try {
        let rainDatabase = await Rain.findOne({ state: 'running' }).select('state updatedAt type').lean();

        if(rainDatabase !== null && String(rainDatabase._id) !== String(rain._id)) {
            const delay = Math.max(1000, generalRainEndsAtSafe(rainDatabase) - Date.now());

            rainDatabase = await Rain.findByIdAndUpdate(rain._id, {
                state: 'pending',
                updatedAt: new Date().getTime()
            }, { new: true }).select('amount participants creator type state updatedAt createdAt').lean();

            setTimeout(() => { generalRainStart(io, rainDatabase); }, delay);
        } else {
            rainDatabase = await Rain.findByIdAndUpdate(rain._id, {
                state: 'running',
                updatedAt: new Date().getTime()
            }, { new: true }).select('amount participants creator type state updatedAt createdAt').populate({
                path: 'creator', select: 'username avatar rank stats anonymous createdAt'
            }).lean();

            if(rainDatabase.type === 'user') { rainDatabase.creator = generalUserGetFormated(rainDatabase.creator); }

            setTimeout(() => { generalRainComplete(io, rainDatabase); }, generalRainDuration(rainDatabase));
        }

        emitRain(io, rainDatabase);
    } catch(err) {
        console.error(err);
    }
}

const generalRainEndsAtSafe = (rain) => {
    return new Date(rain.updatedAt).getTime() + generalRainDuration(rain);
}

const generalRainComplete = async(io, rain) => {
    try {
        let rainDatabase = await Rain.findById(rain._id).select('amount participants creator type state updatedAt createdAt').populate({
            path: 'participants', populate: { path: 'user', select: 'balance xp stats rakeback ips mute ban' }
        }).lean();

        if (!rainDatabase || rainDatabase.state === 'completed' || rainDatabase.state === 'canceled') return;

        const totalWager = rainDatabase.participants.reduce((sum, p) => sum + Math.max(0, p.wager || 0), 0);
        const payoutAddresses = [];
        const promisesUsers = [];
        const promisesTransactions = [];
        let distributed = 0;

        for(const participant of rainDatabase.participants) {
            if (!participant.user) continue;

            let payout = 0;
            if (totalWager > 0) {
                payout = Math.floor(rainDatabase.amount * (Math.max(0, participant.wager || 0) / totalWager));
            } else if (rainDatabase.participants.length > 0) {
                payout = Math.floor(rainDatabase.amount / rainDatabase.participants.length);
            }

            const ip = participant.user.ips && participant.user.ips[0] && participant.user.ips[0].address;
            if ((ip && payoutAddresses.includes(ip)) || isNaN(payout) === true || payout < 10) continue;
            if (ip) payoutAddresses.push(ip);

            distributed += payout;

            promisesUsers.push(
                User.findByIdAndUpdate(participant.user._id, {
                    $inc: {
                        balance: payout,
                        'limits.betToWithdraw': payout
                    },
                    updatedAt: new Date().getTime()
                }, { new: true }).select('balance xp stats rakeback mute ban verifiedAt updatedAt').lean()
            );

            promisesTransactions.push(
                BalanceTransaction.create({
                    amount: payout,
                    type: 'rainPayout',
                    user: participant.user._id,
                    state: 'completed'
                })
            );
        }

        let dataDatabase = await Promise.all([
            Rain.findByIdAndUpdate(rainDatabase._id, { state: 'completed', updatedAt: new Date().getTime() }, { new: true }).select('amount participants state updatedAt').lean(),
            ...promisesUsers,
            ...promisesTransactions
        ]);

        for(const user of dataDatabase.slice(1, promisesUsers.length + 1)) { io.of('/general').to(user._id.toString()).emit('user', { user: user }); }

        for(const transaction of dataDatabase.slice(promisesUsers.length + 1)) { io.of('/general').to(transaction.user.toString()).emit('rainPayout', { transaction: transaction }); }

        generalChatAddMessage(io, {
            rain: dataDatabase[0],
            type: 'rainCompleted'
        });

        if(rain.type === 'site') {
            const leftover = Math.max(0, rainDatabase.amount - distributed);
            const nextAmount = rainDatabase.participants.length === 0
                ? Math.max(rainDatabase.amount, RAIN_SITE_SEED)
                : RAIN_SITE_SEED + leftover;

            rainDatabase = await Rain.create({
                amount: nextAmount,
                type: 'site',
                state: 'created'
            });

            rainDatabase = rainDatabase.toObject();
            emitRain(io, rainDatabase);
            generalRainStart(io, rainDatabase);
        }
    } catch(err) {
        console.error(err);
    }
}

const generalRainInit = async(io) => {
    try {
        const rainsDatabase = await Rain.find({ $or: [{ state: 'created' }, { state: 'pending' }, { state: 'running' }] }).select('participants type state createdAt').lean();

        for(const rain of rainsDatabase) { await Rain.findByIdAndUpdate(rain._id, { state: 'canceled', updatedAt: new Date().getTime() }, {}); }

        let rainDatabase = await Rain.create({
            amount: RAIN_SITE_SEED,
            type: 'site',
            state: 'created'
        });

        rainDatabase = rainDatabase.toObject();
        generalRainStart(io, rainDatabase);
    } catch(err) {
        console.error(err);
    }
}

module.exports = {
    generalGetRains,
    generalSendRainCreateSocket,
    generalSendRainTipSocket,
    generalSendRainJoinSocket,
    generalRainInit
}
