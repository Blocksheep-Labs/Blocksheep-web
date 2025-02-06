const mongoose = require('mongoose');

const RaceProgressSchema = new mongoose.Schema({
    room: String,
    userAddress: String,
    progress: Object,
});

module.exports =  mongoose.model('RaceProgress', RaceProgressSchema);
