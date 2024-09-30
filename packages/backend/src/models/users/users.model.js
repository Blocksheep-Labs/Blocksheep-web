const User = require("./users.mongo");

const setNameByAddress = async(name, address) => {
    return await User.findOneAndUpdate(
        { 
            address 
        },
        { 
            name 
        },
        { 
            new: true, 
            upsert: true 
        }
    );
}

const getUserDataByAddress = async(address) => {
    return await User.findOne({ address });
}


module.exports = {
    setNameByAddress,
    getUserDataByAddress
}