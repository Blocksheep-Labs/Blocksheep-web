const mongoose = require('mongoose');

const playerStateSchema = new mongoose.Schema({
    raceId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userAddress: { type: String, required: true },
    status: { type: String, enum: ['active', 'waiting'], required: true },
});

module.exports = mongoose.model('PlayerState', playerStateSchema);
