const mongoose = require('mongoose');

const GameCompletesSchema = new mongoose.Schema({
    raceId: { type: String, required: true },
    userAddress: { type: String, required: true },
    completed: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('GameCompletes', GameCompletesSchema);