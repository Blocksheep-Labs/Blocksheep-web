const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    gamesAboveAverage: {
        type: Number,
        default: 0,
    },
    previousGamesAboveAverage: {
        type: Number,
        default: 0,
    },
    finishedRaces: [{
        raceId: {
            type: Number,
            required: true,
        },
        previousGamesAboveAverage: {
            type: Number,
            required: true,
        },
        newGamesAboveAverage: {
            type: Number,
            required: true,
        }
    }]
}, { timestamps: true });

module.exports = mongoose.model("User", usersSchema);