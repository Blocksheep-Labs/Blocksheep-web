import { Request, Response } from "express";
import * as racesModel from "../models/races/races.model";

export const insertUser = async (req: Request, res: Response) => {
    const { raceId, userId } = req.body;

    try {
        const race = await racesModel.insertUser(raceId, userId);
        return res.status(201).json({
            ok: true,
            race,
        });
    } catch (error) {
        return res.status(400).json({
            ok: false,
        });
    }
};

export const getRaceDataById = async (req: Request, res: Response) => {
    const { raceId } = req.query;

    try {
        const race = await racesModel.getRaceDataById(raceId as string);
        return res.status(200).json({
            ok: true,
            race,
        });
    } catch (error) {
        return res.status(400).json({
            ok: false,
        });
    }
};

export const createRace = async (req: Request, res: Response) => {
    const { raceId } = req.body;

    try {
        const race = await racesModel.createRace(raceId);
        return res.status(200).json({
            ok: true,
            race,
        });
    } catch (error) {
        return res.status(400).json({
            ok: false,
            error,
        });
    }
};

export const getUserParticipatesIn = async (req: Request, res: Response) => {
    const { address } = req.query;

    try {
        const races = await racesModel.getUserParticipatesIn(address as string);
        return res.status(200).json({
            ok: true,
            races,
        });
    } catch (error) {
        return res.status(400).json({
            ok: false,
        });
    }
};
