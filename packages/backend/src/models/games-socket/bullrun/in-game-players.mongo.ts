import mongoose, { Document, Schema } from 'mongoose';

interface IInGamePlayer extends Document {
    raceId: string;
    userAddress: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const InGamePlayerSchema = new Schema<IInGamePlayer>({
    raceId: { type: String, required: true },
    userAddress: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IInGamePlayer>('InGamePlayer', InGamePlayerSchema);
