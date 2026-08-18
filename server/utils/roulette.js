const { generateFloats, hashServerSeed } = require('./fair');

const SLOTS = 15;
const MULTIPLIER = { red: 2, black: 2, green: 14 };
const BET_MS = 15000;
const SPIN_MS = 6000;
const COOLDOWN_MS = 2500;

function rouletteColor(n) {
    const slot = Number(n);
    if (slot === 0) return 'green';
    if (slot >= 1 && slot <= 7) return 'red';
    return 'black';
}

function rouletteMultiplier(color) {
    return MULTIPLIER[color] || 0;
}

function rouletteRoll(seedServer, seedPublic) {
    const [float] = generateFloats({
        serverSeed: seedServer,
        clientSeed: seedPublic,
        nonce: 0,
        count: 1
    });
    return Math.min(SLOTS - 1, Math.floor(float * SLOTS));
}

function rouletteSanitizeGame(game, extra = {}) {
    if (!game) return null;
    const seed = game.fair && game.fair.seed ? game.fair.seed : {};
    const rolling = game.state === 'rolling' || game.state === 'completed';
    return {
        _id: game._id,
        state: game.state,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
        endsAt: extra.endsAt || game.endsAt,
        outcome: rolling ? game.outcome : undefined,
        color: rolling ? game.color : undefined,
        fair: {
            hash: seed.hash,
            seedPublic: seed.seedPublic,
            seedServer: rolling ? seed.seedServer : undefined
        }
    };
}

function rouletteSanitizeBet(bet) {
    const user = bet.user || {};
    return {
        _id: bet._id,
        amount: bet.amount,
        payout: bet.payout,
        color: bet.color,
        multiplier: bet.multiplier,
        user: {
            _id: user._id,
            username: user.username,
            avatar: user.avatar,
            rank: user.rank,
            level: user.level
        }
    };
}

function rouletteCheckBet(data, user, game) {
    if (!data || isNaN(data.amount) || Math.floor(data.amount) <= 0) {
        throw new Error('You’ve entered an invalid bet amount.');
    }
    if (!['red', 'black', 'green'].includes(data.color)) {
        throw new Error('Your entered color is invalid.');
    }
    if (!game || game.state !== 'created') {
        throw new Error('You need to wait for the next round before you can bet.');
    }
    if (user.balance < Math.floor(data.amount)) {
        throw new Error('You don’t have enough balance for this action.');
    }
    const min = Math.floor((Number(process.env.DICE_MIN_AMOUNT) || 0.01) * 1000);
    if (Math.floor(data.amount) < min) {
        throw new Error('Your bet is below the minimum amount.');
    }
}

module.exports = {
    SLOTS,
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
};
