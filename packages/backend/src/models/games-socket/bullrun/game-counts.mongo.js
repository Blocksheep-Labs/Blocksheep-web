const mongoose = require('mongoose');

const GameCountSchema = new mongoose.Schema({
    raceId: { type: String, required: true },
    userAddress: { type: String, required: true },
    count: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('GameCount', GameCountSchema);