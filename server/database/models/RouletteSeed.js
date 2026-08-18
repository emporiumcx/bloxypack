const mongoose = require('mongoose');

const rouletteSeedSchema = new mongoose.Schema({
    seedServer: { type: String },
    seedPublic: { type: String },
    hash: { type: String },
    state: { type: String },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('RouletteSeed', rouletteSeedSchema);
