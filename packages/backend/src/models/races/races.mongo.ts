import mongoose, { Document, Schema } from "mongoose";

interface IRace extends Document {
    raceId: string;
    users: mongoose.Types.ObjectId[];
    screenTimings: Record<string, any>;
    usersSheeps: Record<string, number> 
    usersWarCry: Record<string, number>
}

const racesSchema: Schema<IRace> = new Schema({
    raceId: {
        type: String,
        required: true,
        unique: true,
    },
    screenTimings: Object,
    users: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            autopopulate: true
        }],
    },
    usersSheeps: {
        type: Map,
        of: String, // Stores userAddress as key and selected sheep (number) as value
        default: {}
    },
    usersWarCry: {
        type: Map,
        of: String, // Stores userAddress as key and selected audio (number) as value
        default: {}
    }

}, { timestamps: true });

racesSchema.plugin(require("mongoose-autopopulate"));

export default mongoose.model<IRace>("Race", racesSchema);