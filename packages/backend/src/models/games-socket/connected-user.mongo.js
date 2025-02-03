const mongoose = require('mongoose');

const ConnectedUserSchema = new mongoose.Schema({
    room: String,
    id: String,
    userAddress: String,
});


module.exports = mongoose.model('ConnectedUser', ConnectedUserSchema);
