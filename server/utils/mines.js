const { generateFloats, pickIndices } = require('./fair');

const minesCheckSendBetData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.amount === undefined || isNaN(data.amount) === true || Math.floor(data.amount) <= 0) {
        throw new Error('You’ve entered an invalid bet amount.');
    } else if(data.minesCount === undefined || isNaN(data.minesCount) === true || Math.floor(data.minesCount) <= 0) {
        throw new Error('You’ve entered an invalid mines count.');
    } else if(data.grid !== undefined && (isNaN(data.grid) === true || Math.floor(data.grid) < 4 || Math.floor(data.grid) > 8)) {
        throw new Error('You’ve entered an invalid grid size.');
    } else if(Math.floor(data.amount) < Math.floor(process.env.MINES_MIN_AMOUNT * 1000)) {
        throw new Error(`You can only bet a min amount of ${parseFloat(process.env.MINES_MIN_AMOUNT).toFixed(2)} per game.`);
    } else if(Math.floor(data.amount) > Math.floor(process.env.MINES_MAX_AMOUNT * 1000)) {
        throw new Error(`You can only bet a max amount of ${parseFloat(process.env.MINES_MAX_AMOUNT).toFixed(2)} per game.`);
    }
}

const minesCheckSendBetUser = (data, user) => {
    if(user.balance < Math.floor(data.amount)) {
        throw new Error('You don’t have enough balance for this action.');
    }
}

const minesCheckSendBetGame = (minesGame) => {
    if(minesGame !== undefined) {
        throw new Error('You need to complete your running mines game first.');
    }
}

const minesCheckSendBetSeed = (seedDatabase) => {
    if(seedDatabase === null) {
        throw new Error('You need to generate a server seed first.');
    }
}

const minesCheckSendRevealData = (data) => {
    if(data === undefined || data === null) {
        throw new Error('Something went wrong. Please try again in a few seconds.');
    } else if(data.tile === undefined || isNaN(data.tile) === true || Math.floor(data.tile) < 0) {
        throw new Error('Your entered tile is invalid.');
    }
}

const minesCheckSendRevealGame = (minesGame, data) => {
    if(minesGame === undefined) {
        throw new Error('You have no running mines game at the moment.');
    } else if(minesGame.revealed.some((element) => element.tile === Math.floor(data.tile)) === true) {
        throw new Error('Your entered tile is already revealed.');
    }
}

const minesCheckSendCashoutGame = (minesGame) => {
    if(minesGame === undefined) {
        throw new Error('You have no running mines game at the moment.');
    } else if(minesGame.revealed.length === 0) {
        throw new Error('You need to reveal at least one tile.');
    }
}

const minesGetGamePayout = (minesGame) => {
    const cells = minesGame.grid * minesGame.grid;
    const safe = minesGame.revealed.length;
    if (safe < 1) return 0;
    const multiplier = 0.99 * Math.pow(cells / (cells - minesGame.minesCount), safe);
    return Math.floor(minesGame.amount * multiplier);
}

const minesGetGameDeck = (minesCount, grid, seedDatabase) => {
    const cells = grid * grid;
    const floats = generateFloats({
        serverSeed: seedDatabase.seedServer,
        clientSeed: seedDatabase.seedClient,
        nonce: seedDatabase.nonce,
        count: minesCount
    });
    const mineTiles = pickIndices(floats, cells);
    const deck = Array.from({ length: cells }, () => 'coin');
    for (const tile of mineTiles) deck[tile] = 'mine';
    return deck;
}

const minesSanitizeGame = (game) => {
    let sanitized = JSON.parse(JSON.stringify(game));

    if(sanitized.state !== 'completed') {
        delete sanitized.deck;
        delete sanitized.fair;
    }

    return sanitized;
}

module.exports = {
    minesCheckSendBetData,
    minesCheckSendBetUser,
    minesCheckSendBetGame,
    minesCheckSendBetSeed,
    minesCheckSendRevealData,
    minesCheckSendRevealGame,
    minesCheckSendCashoutGame,
    minesGetGamePayout,
    minesGetGameDeck,
    minesSanitizeGame
}
