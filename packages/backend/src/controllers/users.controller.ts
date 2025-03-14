import { Request, Response } from 'express';
import * as userModel from "../models/users/users.model";


// Set name by address
const setNameByAddress = async (req: Request, res: Response): Promise<Response> => {
    const { name, address } = req.body;

    try {
        const user = await userModel.setNameByAddress(name, address);
        return res.status(201).json({
            ok: true,
            user
        });
    } catch (error) {
        return res.status(400).json({
            ok: false
        });
    }
}

// Get user data by address
const getUserDataByAddress = async (req: Request, res: Response): Promise<Response> => {
    const { address } = req.query;

    try {
        const user = await userModel.getUserDataByAddress(address as string); // Typecasting `address` to string
        return res.status(200).json({
            ok: true,
            user
        });
    } catch (error) {
        return res.status(400).json({
            ok: false
        });
    }
}

export {
    setNameByAddress,
    getUserDataByAddress
}
