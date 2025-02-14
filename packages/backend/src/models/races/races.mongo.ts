import mongoose, { Document, Schema } from "mongoose";

interface IRace extends Document {
    raceId: string;
    users: mongoose.Types.ObjectId[];
}

const racesSchema: Schema<IRace> = new Schema({
    raceId: {
        type: String,
        required: true,
        unique: true,
    },
    users: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            autopopulate: true
        }],
    },
}, { timestamps: true });

racesSchema.plugin(require("mongoose-autopopulate"));

export default mongoose.model<IRace>("Race", racesSchema);