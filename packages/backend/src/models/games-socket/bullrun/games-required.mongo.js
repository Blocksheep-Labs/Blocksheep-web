const mongoose = require('mongoose');

const GamesRequiredSchema = new mongoose.Schema({
    raceId: { type: String, required: true },
    userAddress: { type: String, required: true },
    requiredGames: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('GamesRequired', GamesRequiredSchema);