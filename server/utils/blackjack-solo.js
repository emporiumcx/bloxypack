const { generateFloats } = require('./fair');

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['spade', 'heart', 'diamond', 'club'];

const blackjackSoloCheckBet = (data) => {
    if (!data || isNaN(data.amount) || Math.floor(data.amount) <= 0) {
        throw new Error('You’ve entered an invalid bet amount.');
    }
    const min = Math.floor(Number(process.env.BLACKJACK_MIN_AMOUNT || process.env.MINES_MIN_AMOUNT || 0.01) * 1000);
    const max = Math.floor(Number(process.env.BLACKJACK_MAX_AMOUNT || process.env.MINES_MAX_AMOUNT || 1000000) * 1000);
    if (Math.floor(data.amount) < min) {
        throw new Error(`You can only bet a min amount of ${(min / 1000).toFixed(2)} per game.`);
    }
    if (Math.floor(data.amount) > max) {
        throw new Error(`You can only bet a max amount of ${(max / 1000).toFixed(2)} per game.`);
    }
};

const blackjackSoloShuffle = (seedDatabase) => {
    const cards = [];
    for (const suit of SUITS) {
        for (const rank of RANKS) cards.push({ rank, suit });
    }
    const floats = generateFloats({
        serverSeed: seedDatabase.seedServer,
        clientSeed: seedDatabase.seedClient,
        nonce: seedDatabase.nonce,
        count: cards.length - 1
    });
    for (let i = cards.length - 1; i > 0; i--) {
        const j = Math.floor(floats[cards.length - 1 - i] * (i + 1));
        const tmp = cards[i];
        cards[i] = cards[j];
        cards[j] = tmp;
    }
    return cards;
};

const blackjackSoloTotal = (cards) => {
    let t = 0;
    let aces = 0;
    for (const c of cards) {
        if (c.rank === 'A') {
            aces += 1;
            t += 11;
        } else if (['J', 'Q', 'K'].includes(c.rank)) t += 10;
        else t += Number(c.rank);
    }
    while (t > 21 && aces) {
        t -= 10;
        aces -= 1;
    }
    return t;
};

const blackjackSoloPayout = (amount, player, dealer) => {
    const pt = blackjackSoloTotal(player);
    const dt = blackjackSoloTotal(dealer);
    if (pt > 21) return 0;
    const bj = pt === 21 && player.length === 2;
    const dbj = dt === 21 && dealer.length === 2;
    if (bj && !dbj) return Math.floor(amount * 2.5);
    if (dt > 21 || pt > dt) return amount * 2;
    if (pt === dt) return amount;
    return 0;
};

const blackjackSoloDraw = (game) => {
    const card = game.deck[game.cursor];
    game.cursor += 1;
    return card;
};

module.exports = {
    blackjackSoloCheckBet,
    blackjackSoloShuffle,
    blackjackSoloTotal,
    blackjackSoloPayout,
    blackjackSoloDraw
};
