const mongoose = require('mongoose');

const ScreenSchema = new mongoose.Schema({
    raceId: String,
    screens: [String],
    latestScreen: String,
    room: String,
});

module.exports = mongoose.model('Screen', ScreenSchema);
