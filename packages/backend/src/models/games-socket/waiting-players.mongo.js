const mongoose = require('mongoose');

const WaitingPlayerSchema = new mongoose.Schema({
    raceId: String,
    userAddress: String,
});

module.exports = mongoose.model('WaitingPlayer', WaitingPlayerSchema);
