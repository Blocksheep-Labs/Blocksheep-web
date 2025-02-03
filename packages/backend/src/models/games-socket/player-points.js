const mongoose = require('mongoose');


const PlayerPointsSchema = new mongoose.Schema({
    room: String,
    userAddress: String,
    points: Number,
    finished: Boolean,
});

module.exports = mongoose.model('PlayerPoints', PlayerPointsSchema);