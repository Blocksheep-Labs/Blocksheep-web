import mongoose, {Document, Schema} from "mongoose";

interface IBot extends Document {
    address: string;
    connectedRaceIds: string[];
    usersGameMapping: Record<string, string>; // user address -> game name
}

const botsSchema: Schema<IBot> = new Schema({
    address: {
        type: String,
        required: true,
    },
    connectedRaceIds: [{
        type: String,
        default: [],
    }],
    usersGameMapping: {
        type: Map,
        of: String,
        default: {},
    }
}, { timestamps: true });

export default mongoose.model<IBot>("Bot", botsSchema);
