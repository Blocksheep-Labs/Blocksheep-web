import mongoose, { Document, Schema } from 'mongoose';

interface IPlayerState extends Document {
    raceId: string;
    userAddress: string;
    status: 'active' | 'waiting';
    createdAt?: Date;
    updatedAt?: Date;
}

const PlayerStateSchema = new Schema<IPlayerState>({
    raceId: { type: String, required: true },
    userAddress: { type: String, required: true },
    status: { type: String, enum: ['active', 'waiting'], required: true },
}, { timestamps: true });

export default mongoose.model<IPlayerState>('PlayerState', PlayerStateSchema);
