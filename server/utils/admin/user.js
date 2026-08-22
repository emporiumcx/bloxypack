const validator = require('validator');

const adminCheckGetUserListData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.page === undefined || data.page === null || isNaN(data.page) === true || data.page <= 0) {
        throw new Error('Your entered page is invalid.');
    } else if(data.search === undefined || data.search === null || typeof data.search !== 'string') {
        throw new Error('Your entered keyword is invalid.');
    } else if(data.sort === undefined || data.sort === null || typeof data.sort !== 'string' || ['newest', 'oldest', 'balance', 'rank'].includes(data.sort) === false) {
        throw new Error('Your entered sort value is invalid.');
    }
}

const adminCheckGetUserDataData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.userId === undefined || data.userId === null || typeof data.userId !== 'string' || validator.isMongoId(data.userId) !== true) {
        throw new Error('Your entered user id is invalid.');
    }
}

const adminCheckGetUserDataUser = (userDatabase) => {
    if(userDatabase === null) {
        throw new Error('Your entered user id is not available.');
    }
}

const adminCheckGetUserTransactionsData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.userId === undefined || data.userId === null || typeof data.userId !== 'string' || validator.isMongoId(data.userId) !== true) {
        throw new Error('Your entered user id is invalid.');
    } else if(data.page === undefined || data.page === null || isNaN(data.page) === true || data.page <= 0) {
        throw new Error('Your entered page is invalid.');
    }
}

const adminCheckGetUserGamesData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.userId === undefined || data.userId === null || typeof data.userId !== 'string' || validator.isMongoId(data.userId) !== true) {
        throw new Error('Your entered user id is invalid.');
    } else if(data.page === undefined || data.page === null || isNaN(data.page) === true || data.page <= 0) {
        throw new Error('Your entered page is invalid.');
    }
}

const ADMIN_USER_SETTINGS = [
    'rank',
    'flags',
    'stats.deposit',
    'vault.amount',
    'stats.withdraw',
    'limits.blockRain',
    'limits.blockTip',
    'limits.limitTip',
    'limits.blockSponsor',
    'limits.blockLeaderboard',
    'leaderboard.points'
];
const ADMIN_RANKS = ['user', 'mod', 'admin'];
const FILL_MAX_DISPLAY = 1000000;

const adminCheckSendUserValueData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.userId === undefined || data.userId === null || typeof data.userId !== 'string' || validator.isMongoId(data.userId) !== true) {
        throw new Error('Your entered user id is invalid.');
    } else if(data.setting === undefined || typeof data.setting !== 'string' || ADMIN_USER_SETTINGS.includes(data.setting) !== true) {
        throw new Error('Your entered setting is invalid.');
    } else if(data.value === undefined) {
        throw new Error('Your entered value is invalid.');
    } else if(data.setting === 'rank' && (typeof data.value !== 'string' || ADMIN_RANKS.includes(data.value) !== true)) {
        throw new Error('Your entered rank is invalid.');
    }
}

const adminParseFillCommand = (message) => {
    const match = String(message || '').trim().match(/^\/fill\s+(\S+)\s+([0-9]+(?:\.[0-9]{1,2})?)$/i);
    if (!match) {
        throw new Error('Use /fill username amount');
    }
    const amountDisplay = Number(match[2]);
    if (!Number.isFinite(amountDisplay) || amountDisplay <= 0 || amountDisplay > FILL_MAX_DISPLAY) {
        throw new Error(`Fill amount must be between 0.01 and ${FILL_MAX_DISPLAY}.`);
    }
    return {
        username: match[1],
        amountMilli: Math.floor(amountDisplay * 1000)
    };
}

const adminCheckSendUserBalanceData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.userId === undefined || data.userId === null || typeof data.userId !== 'string' || validator.isMongoId(data.userId) !== true) {
        throw new Error('Your entered user id is invalid.');
    } else if(data.balance === undefined || data.balance === null || isNaN(data.balance) === true || data.balance < 0) {
        throw new Error('Your entered balance value is invalid.');
    }
}

const adminCheckSendUserBalanceUser = (userDatabase) => {
    if(userDatabase === null) {
        throw new Error('Your entered user is not available.');
    }
}

const adminCheckSendUserMuteData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.userId === undefined || data.userId === null || typeof data.userId !== 'string' || validator.isMongoId(data.userId) !== true) {
        throw new Error('Your entered user id is invalid.');
    } else if(data.time === undefined || data.time === null || isNaN(data.time) === true || Math.floor(data.time) < 0) {
        throw new Error('Your entered mute time is invalid.');
    } else if(data.reason === undefined || data.reason === null || typeof data.reason !== 'string' || ['insulting', 'racism', 'begging', 'self promotion', 'other'].includes(data.reason) === false) {
        throw new Error('Your entered mute reason is invalid.');
    }
}

const adminCheckSendUserBanData = (data) => {
    if (!data) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if (!data.userId || !validator.isMongoId(data.userId)) {
        throw new Error('Your entered user ID is invalid.');
    } else if (isNaN(data.time) || data.time < -1 || data.time === 0) {
        throw new Error('Your entered ban time is invalid.');
    } else if (typeof data.reason !== 'string') {
        throw new Error('Ban reason is invalid.');
    }
}


const adminCheckSendUserUnBanData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.userId === undefined || data.userId === null || typeof data.userId !== 'string' || validator.isMongoId(data.userId) !== true) {
        throw new Error('Your entered user id is invalid.');
    }
}

const adminFormatUserSort = (value) => {
    let sort = { createdAt: -1 };

    if(value === 'oldest') {
        sort = { createdAt: 1 };
    } else if(value === 'balance') {
        sort = { balance: -1 };
    } else if(value === 'rank') {
        sort = { rank: 1 };
    }

    return sort;
}

module.exports = {
    ADMIN_RANKS,
    adminCheckGetUserListData,
    adminCheckGetUserDataData,
    adminCheckGetUserDataUser,
    adminCheckGetUserTransactionsData,
    adminCheckGetUserGamesData,
    adminCheckSendUserValueData,
    adminCheckSendUserBalanceData,
    adminCheckSendUserBalanceUser,
    adminCheckSendUserMuteData,
    adminCheckSendUserBanData,
    adminCheckSendUserUnBanData,
    adminFormatUserSort,
    adminParseFillCommand
}
