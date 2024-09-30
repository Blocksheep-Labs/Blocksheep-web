const racesModel = require("../models/races/races.model");

const insertUser = async(req, res) => {
    const { raceId, userId } = req.body;

    try {
        const race = await racesModel.insertUser(raceId, userId);
        return res.status(201).json({
            ok: true,
            race,
        })
    } catch (error) {
        return res.status(400).json({
            ok: false,
        });
    }
}


const getRaceDataById = async(req, res) => {
    const { raceId } = req.query;

    try {
        const race = await racesModel.getRaceDataById(raceId);
        return res.status(200).json({
            ok: true,
            race,
        })
    } catch (error) {
        return res.status(400).json({
            ok: false,
        });
    }
}

module.exports = {
    insertUser,
    getRaceDataById,
}