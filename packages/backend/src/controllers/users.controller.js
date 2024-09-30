const User = require("../models/users/users.model");


const setNameByAddress = async(req, res) => {
    const { name, address } = req.body;

    try {
        const user = await User.setNameByAddress(name, address);
        return res.status(201).json({
            ok: true,
            user
        })
    } catch (error) {
        return res.status(400).json({
            ok: false
        });
    }
}

const getUserDataByAddress = async(req, res) => {
    const { address } = req.query;

    try {
        const user = await User.getUserDataByAddress(address);
        return res.status(200).json({
            ok: true,
            user
        })
    } catch (error) {
        return res.status(400).json({
            ok: false
        });
    }
}

module.exports = {
    setNameByAddress,
    getUserDataByAddress
}