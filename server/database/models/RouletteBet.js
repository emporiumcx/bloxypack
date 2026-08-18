const mongoose = require('mongoose');

const rouletteBetSchema = new mongoose.Schema({
    amount: { type: Number },
    payout: { type: Number },
    color: { type: String },
    multiplier: { type: Number },
    game: { type: mongoose.Schema.ObjectId, ref: 'RouletteGame' },
    user: { type: mongoose.Schema.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RouletteBet', rouletteBetSchema);
