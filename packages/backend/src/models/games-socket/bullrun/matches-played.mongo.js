const mongoose = require('mongoose');

const MatchPlayedSchema = new mongoose.Schema({
    raceId: { type: String, required: true },
    player1: { type: String, required: true },
    player2: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('MatchPlayed', MatchPlayedSchema);