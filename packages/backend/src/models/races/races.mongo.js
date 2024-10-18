const mongoose = require("mongoose");

const racesSchema = new mongoose.Schema({
    raceId: {
        type: String,
        required: true,
        unique: true,
    },
    storyKey: {
        type: Number,
        required: true,
        default: 0,
    },
    users: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            autopopulate: true
        }],
    },
}, { timestamps: true });

racesSchema.plugin(require("mongoose-autopopulate"));

module.exports = mongoose.model("Race", racesSchema);