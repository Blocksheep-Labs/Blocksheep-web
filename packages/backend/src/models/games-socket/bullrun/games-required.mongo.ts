import mongoose, { Document, Schema } from 'mongoose';

interface IGamesRequired extends Document {
    raceId: string;
    userAddress: string;
    requiredGames: number;
    createdAt?: Date;
    updatedAt?: Date;
}

const GamesRequiredSchema = new Schema<IGamesRequired>({
    raceId: { type: String, required: true },
    userAddress: { type: String, required: true },
    requiredGames: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.model<IGamesRequired>('GamesRequired', GamesRequiredSchema);
