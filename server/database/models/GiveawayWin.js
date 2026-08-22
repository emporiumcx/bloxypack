const mongoose = require('mongoose');

const giveawayWinSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.ObjectId, ref: 'User' },
    kind: { type: String },
    periodKey: { type: String },
    slug: { type: String },
    state: { type: String, default: 'claimable' },
    expiresAt: { type: Date },
    openedAt: { type: Date },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GiveawayWin', giveawayWinSchema);
