const mongoose = require("mongoose");

const usersSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        required: true,
    }
}, { timestamps: true });

module.exports = mongoose.model("User", usersSchema);