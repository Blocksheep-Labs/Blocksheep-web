const mongoose = require('mongoose');

const ActivePlayerSchema = new mongoose.Schema({
    raceId: String,
    userAddress: String,
});

module.exports = mongoose.model('ActivePlayer', ActivePlayerSchema);
