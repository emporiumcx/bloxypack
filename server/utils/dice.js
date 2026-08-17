const { generateFloats } = require('./fair');

const diceCheckSendBetData = (data) => {
    if (!data || isNaN(data.amount) || Math.floor(data.amount) <= 0) {
        throw new Error('You’ve entered an invalid bet amount.');
    }
    if (typeof data.rollOver !== 'boolean') {
        throw new Error('You’ve entered an invalid roll mode.');
    }
    if (isNaN(data.target) || data.target < 2 || data.target > 98) {
        throw new Error('You’ve entered an invalid roll target.');
    }
    if (Math.floor(data.amount) < Math.floor(process.env.DICE_MIN_AMOUNT * 1000)) {
        throw new Error(`You can only bet a min amount of ${parseFloat(process.env.DICE_MIN_AMOUNT).toFixed(2)} per game.`);
    }
    if (Math.floor(data.amount) > Math.floor(process.env.DICE_MAX_AMOUNT * 1000)) {
        throw new Error(`You can only bet a max amount of ${parseFloat(process.env.DICE_MAX_AMOUNT).toFixed(2)} per game.`);
    }
};

const diceMultiplier = (rollOver, target) => {
    const chance = rollOver ? 100 - target : target;
    return Math.max(1.01, Number((90 / Math.max(1, chance)).toFixed(4)));
};

const diceRoll = (seedDatabase) => {
    const [float] = generateFloats({
        serverSeed: seedDatabase.seedServer,
        clientSeed: seedDatabase.seedClient,
        nonce: seedDatabase.nonce,
        count: 1
    });
    return float * 10000;
};

module.exports = { diceCheckSendBetData, diceMultiplier, diceRoll };
