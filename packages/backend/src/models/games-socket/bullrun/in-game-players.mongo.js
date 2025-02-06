const mongoose = require('mongoose');

const InGamePlayerSchema = new mongoose.Schema({
    raceId: { type: String, required: true },
    userAddress: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model('InGamePlayer', InGamePlayerSchema);