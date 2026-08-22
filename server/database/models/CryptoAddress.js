const mongoose = require('mongoose');

const cryptoAddressSchema = new mongoose.Schema({
    name: { type: String },
    address: { type: String },
    creditedSol: { type: Number, default: 0 },
    creditedUsdc: { type: Number, default: 0 },
    user: { type: mongoose.Schema.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CryptoAddress',  cryptoAddressSchema);
