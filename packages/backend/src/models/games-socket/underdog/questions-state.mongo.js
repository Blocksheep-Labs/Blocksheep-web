const mongoose = require('mongoose');


const QuestionsStateSchema = new mongoose.Schema({
    room: String,
    index: Number,
    secondsLeft: Number,
});

module.exports = mongoose.model('QuestionsState', QuestionsStateSchema);
