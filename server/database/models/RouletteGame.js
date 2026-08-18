const mongoose = require('mongoose');

const rouletteGameSchema = new mongoose.Schema({
    outcome: { type: Number },
    color: { type: String },
    fair: {
        seed: { type: mongoose.Schema.ObjectId, ref: 'RouletteSeed' }
    },
    state: { type: String },
    updatedAt: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now }
});

rouletteGameSchema.virtual('bets', {
    ref: 'RouletteBet',
    localField: '_id',
    foreignField: 'game',
    justOne: false
});

rouletteGameSchema.set('toObject', { virtuals: true });
rouletteGameSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('RouletteGame', rouletteGameSchema);
