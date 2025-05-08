const mongoose = require('mongoose');
require("dotenv").config();

const MONGO_URL = process.env.MONGO_URL;

const connectMongo = async() => {
    // prepare mongoose events
    mongoose.connection.once('open', () => {
        console.log('[DB] MongoDB connection established.')
    });
    mongoose.connection.on('error', (err) => {
        console.error(`[DB] ${err}`);
    });
    
    console.log(`[DB] Connecting...`)
    
    // connect mongo
    await mongoose.connect(MONGO_URL).catch(console.error);
}

module.exports = connectMongo;