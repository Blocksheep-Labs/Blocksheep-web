import mongoose, { Document, Schema } from 'mongoose';

interface IGameCount extends Document {
    raceId: string;
    userAddress: string;
    count: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const GameCountSchema = new Schema<IGameCount>({
    raceId: { type: String, required: true },
    userAddress: { type: String, required: true },
    count: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IGameCount>('GameCount', GameCountSchema);
