import mongoose, { Document, Schema } from 'mongoose';

interface IGameCompletes extends Document {
    raceId: string;
    userAddress: string;
    completed: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

const GameCompletesSchema = new Schema<IGameCompletes>({
    raceId: { type: String, required: true },
    userAddress: { type: String, required: true },
    completed: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model<IGameCompletes>('GameCompletes', GameCompletesSchema);
