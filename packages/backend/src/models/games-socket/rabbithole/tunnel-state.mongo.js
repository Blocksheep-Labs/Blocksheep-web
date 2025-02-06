const mongoose = require('mongoose');

const TunnelStateSchema = new mongoose.Schema({
    room: String,
    secondsLeft: Number,
    roundsPlayed: Number,
});

module.exports = mongoose.model('TunnelState', TunnelStateSchema);
