const { generateFloats, pickIndices } = require('./fair');

const TOWERS_CONFIG = {
    easy: { tiles: 4, mines: 1, ratio: 4 / 3 },
    medium: { tiles: 3, mines: 1, ratio: 3 / 2 },
    hard: { tiles: 2, mines: 1, ratio: 2 / 1 },
    expert: { tiles: 3, mines: 2, ratio: 3 / 1 }
};

const towersCheckSendBetData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.amount === undefined || isNaN(data.amount) === true || Math.floor(data.amount) <= 0) {
        throw new Error('You’ve entered an invalid bet amount.');
    } else if(data.risk === undefined || typeof data.risk !== 'string' || Object.keys(TOWERS_CONFIG).includes(data.risk) !== true) {
        throw new Error('You’ve entered an invalid risk.');
    } else if(Math.floor(data.amount) < Math.floor(process.env.TOWERS_MIN_AMOUNT * 1000)) {
        throw new Error(`You can only bet a min amount of ${parseFloat(process.env.TOWERS_MIN_AMOUNT).toFixed(2)} per game.`);
    } else if(Math.floor(data.amount) > Math.floor(process.env.TOWERS_MAX_AMOUNT * 1000)) {
        throw new Error(`You can only bet a max amount of ${parseFloat(process.env.TOWERS_MAX_AMOUNT).toFixed(2)} per game.`);
    }
}

const towersCheckSendBetUser = (data, user) => {
    if(user.balance < Math.floor(data.amount)) {
        throw new Error('You don’t have enough balance for this action.');
    }
}

const towersCheckSendBetGame = (towersGame) => {
    if(towersGame !== undefined) {
        throw new Error('You need to complete your running towers game first.');
    }
}

const towersCheckSendBetSeed = (seedDatabase) => {
    if(seedDatabase === null) {
        throw new Error('You need to generate a server seed first.');
    }
}

const towersCheckSendRevealData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.tile === undefined || data.tile === null || isNaN(data.tile) === true || Math.floor(data.tile) < 0) {
        throw new Error('You’ve entered an invalid tile.');
    }
}

const towersCheckSendRevealGame = (towersGame) => {
    if(towersGame === undefined) {
        throw new Error('You’ve no running towers game at the moment.');
    }
}

const towersCheckSendCashoutGame = (towersGame) => {
    if(towersGame === null) {
        throw new Error('You’ve no running towers game at the moment.');
    } else if(towersGame.revealed.length === 0) {
        throw new Error('You’ve to reveal at least one row.');
    }
}

const towersGetGamePayout = (towersGame) => {
    const config = TOWERS_CONFIG[towersGame.risk];
    const steps = towersGame.revealed.length;
    const multiplier = 0.97 * Math.pow(config.ratio, steps);
    return Math.floor(towersGame.amount * multiplier);
}

const towersGenerateDeck = (risk, seedDatabase) => {
    const config = TOWERS_CONFIG[risk];
    const floats = generateFloats({
        serverSeed: seedDatabase.seedServer,
        clientSeed: seedDatabase.seedClient,
        nonce: seedDatabase.nonce,
        count: 9 * config.mines
    });

    const deck = [];
    for (let i = 0; i < 9; i++) {
        const rowFloats = floats.slice(i * config.mines, (i + 1) * config.mines);
        const mineTiles = pickIndices(rowFloats, config.tiles);
        const row = Array.from({ length: config.tiles }, () => 'coin');
        for (const tile of mineTiles) row[tile] = 'lose';
        deck.push(row);
    }
    return deck;
}

const towersShuffleDeck = (deck) => deck;

const towersSanitizeGame = (towersGame) => {
    let sanitized = JSON.parse(JSON.stringify(towersGame));

    if(sanitized.state !== 'completed') {
        delete sanitized.deck;
        delete sanitized.fair;
    }

    return sanitized;
}

module.exports = {
    TOWERS_CONFIG,
    towersCheckSendBetData,
    towersCheckSendBetUser,
    towersCheckSendBetGame,
    towersCheckSendBetSeed,
    towersCheckSendRevealData,
    towersCheckSendRevealGame,
    towersCheckSendCashoutGame,
    towersGetGamePayout,
    towersGenerateDeck,
    towersShuffleDeck,
    towersSanitizeGame
}
