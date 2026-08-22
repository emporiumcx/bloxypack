const mongoose = require('mongoose');

const giveawayDrawSchema = new mongoose.Schema({
    kind: { type: String },
    periodKey: { type: String },
    slug: { type: String },
    user: { type: mongoose.Schema.ObjectId, ref: 'User' },
    skipped: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GiveawayDraw', giveawayDrawSchema);
