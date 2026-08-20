const mongoose = require('mongoose');
const CrashBet = require('../../database/models/CrashBet');
const RollBet = require('../../database/models/RollBet');
const RouletteBet = require('../../database/models/RouletteBet');
const BattlesBet = require('../../database/models/BattlesBet');
const DuelsBet = require('../../database/models/DuelsBet');
const BlackjackBet = require('../../database/models/BlackjackBet');
const MinesGame = require('../../database/models/MinesGame');
const TowersGame = require('../../database/models/TowersGame');
const UnboxGame = require('../../database/models/UnboxGame');
const UpgraderGame = require('../../database/models/UpgraderGame');
const DiceBet = require('../../database/models/DiceBet');

const RAIN_SITE_MS = 1000 * 60 * 60;
const RAIN_USER_MS = 1000 * 60 * 2;
const RAIN_JOIN_WINDOW_MS = 1000 * 60 * 5;
const RAIN_WAGER_WINDOW_MS = 1000 * 60 * 60 * 24 * 3;
const RAIN_MIN_JOIN_WAGER = 5000 * 1000;
const RAIN_SITE_SEED = 250000;

const minTipAmount = () => Math.floor((Number(process.env.RAIN_MIN_TIP_AMOUNT) || 1) * 1000);
const minHostAmount = () => Math.floor((Number(process.env.RAIN_MIN_HOST_AMOUNT) || 10) * 1000);

const generalRainDuration = (rain) => (rain && rain.type === 'user' ? RAIN_USER_MS : RAIN_SITE_MS);

const generalRainEndsAt = (rain) => {
    if (!rain || !rain.updatedAt) return Date.now() + RAIN_SITE_MS;
    return new Date(rain.updatedAt).getTime() + generalRainDuration(rain);
};

const generalRainPublic = (rain) => {
    if (!rain) return rain;
    return {
        _id: rain._id,
        amount: rain.amount,
        participants: (rain.participants || []).map((p) => ({
            user: p.user && p.user._id ? p.user._id : p.user
        })),
        creator: rain.creator,
        type: rain.type,
        state: rain.state,
        updatedAt: rain.updatedAt,
        createdAt: rain.createdAt,
        endsAt: generalRainEndsAt(rain)
    };
};

const sumWager = async (Model, match, amountExpr = '$amount') => {
    const rows = await Model.aggregate([
        { $match: match },
        { $group: { _id: null, total: { $sum: amountExpr } } }
    ]);
    return rows[0] ? Math.floor(rows[0].total || 0) : 0;
};

const generalGetUserWagerSince = async (userId, since) => {
    const id = mongoose.Types.ObjectId.isValid(String(userId)) ? new mongoose.Types.ObjectId(String(userId)) : userId;
    const match = { user: id, createdAt: { $gte: since } };
    const totals = await Promise.all([
        sumWager(CrashBet, match),
        sumWager(RollBet, match),
        sumWager(RouletteBet, match),
        sumWager(DiceBet, match),
        sumWager(MinesGame, match),
        sumWager(TowersGame, match),
        sumWager(UnboxGame, match),
        sumWager(UpgraderGame, match),
        sumWager(BattlesBet, { ...match, bot: { $ne: true } }),
        sumWager(DuelsBet, { ...match, bot: { $ne: true } }),
        sumWager(BlackjackBet, match, {
            $add: [
                { $ifNull: ['$amount.main', 0] },
                { $ifNull: ['$amount.sideLeft', 0] },
                { $ifNull: ['$amount.sideRight', 0] }
            ]
        })
    ]);
    return totals.reduce((sum, n) => sum + n, 0);
};

const generalCheckSendRainCreateData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.amount === undefined || data.amount === null || isNaN(data.amount) === true || Math.floor(data.amount) <= 0) {
        throw new Error('Your entered rain amount is invalid.');
    } else if(Math.floor(data.amount) < minHostAmount()) {
        throw new Error(`You can only host a rain with a minmum amount of ${Math.floor(minHostAmount() / 1000)} coins.`);
    }
}

const generalCheckSendRainCreateRain = (checkRain, generalRainCreateBlock) => {
    if(checkRain !== null) {
        throw new Error('You need to wait for the current hosted rain to complete.');
    } else if(generalRainCreateBlock.length !== 0) {
        throw new Error('You need to wait for the current hosted rain to complete.');
    }
}

const generalCheckSendRainCreateUser = (data, user) => {
    if(user.balance < Math.floor(data.amount)) {
        throw new Error('You don’t have enough balance for this action.');
    } if(user.limits.blockSponsor === true) {
        throw new Error('You aren\'t allowed to create a rain at the moment.');
    }
}

const generalCheckSendRainTipData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.amount === undefined || data.amount === null || isNaN(data.amount) === true || Math.floor(data.amount) <= 0) {
        throw new Error('Your entered tip amount is invalid.');
    } else if(Math.floor(data.amount) < minTipAmount()) {
        throw new Error(`You can only tip a minmum amount of ${Math.floor(minTipAmount() / 1000)} coins to the rain.`);
    }
}

const generalCheckSendRainTipRain = (rainDatabase) => {
    if(rainDatabase === null) {
        throw new Error('Your entered rain is not available.');
    } else if(rainDatabase.state !== 'created' && rainDatabase.state !== 'pending' && rainDatabase.state !== 'running') {
        throw new Error('Your entered rain is already completed');
    }
}

const generalCheckSendRainTipUser = (data, user) => {
    if(user.balance < Math.floor(data.amount)) {
        throw new Error('You don’t have enough balance for this action.');
    } else if(user.limits.blockSponsor === true) {
        throw new Error('You aren\'t allowed to tip the rain at the moment.');
    }
}

const generalCheckSendRainJoinData = (data) => {
    if(data === undefined || data === null) {
        data = {};
    }
}

const generalCheckSendRainJoinRain = (user, rainDatabase, settings) => {
    if(rainDatabase === null) {
        throw new Error('Your entered rain is not available.');
    } else if(generalRainEndsAt(rainDatabase) <= new Date().getTime()) {
        throw new Error('Your entered rain is already completed');
    } else if(generalRainEndsAt(rainDatabase) - Date.now() > RAIN_JOIN_WINDOW_MS) {
        throw new Error('You can join the rain in the last 5 minutes.');
    } else if(rainDatabase.participants.some((element) => element.user.toString() === user._id.toString()) === true) {
        throw new Error('You can only join the rain once.');
    } else if(rainDatabase.type === 'site' && settings.general.rain.enabled !== true) {
        throw new Error('The rain is currently unavailable at this time.');
    }
}

const generalCheckSendRainJoinUser = (user) => {
    if(user.limits.blockRain === true) {
        throw new Error('You aren\'t allowed to join the rain at the moment.');
    }
}

const generalCheckSendRainJoinWager = (wager, rainDatabase) => {
    if (rainDatabase && rainDatabase.type !== 'site') return;
    if (wager < RAIN_MIN_JOIN_WAGER) {
        const have = Math.floor(wager / 1000);
        throw new Error(`You need to wager 5,000 coins in the last 3 days to join rain. You have wagered ${have.toLocaleString('en-US')}.`);
    }
}

module.exports = {
    RAIN_SITE_MS,
    RAIN_USER_MS,
    RAIN_JOIN_WINDOW_MS,
    RAIN_WAGER_WINDOW_MS,
    RAIN_MIN_JOIN_WAGER,
    RAIN_SITE_SEED,
    generalRainDuration,
    generalRainEndsAt,
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
}
