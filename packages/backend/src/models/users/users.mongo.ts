import mongoose, { Document, Schema } from "mongoose";

interface IFinishedRace {
    raceId: number;
    previousGamesAboveAverage: number;
    newGamesAboveAverage: number;
}

interface IUser extends Document {
    name: string;
    address: string;
    gamesAboveAverage: number;
    previousGamesAboveAverage: number;
    finishedRaces: IFinishedRace[];
    isBot: boolean;
}

const usersSchema: Schema<IUser> = new Schema({
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
    }],
    isBot: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });

export default mongoose.model<IUser>("User", usersSchema);