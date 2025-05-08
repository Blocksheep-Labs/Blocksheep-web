import mongoose, { Document, Schema } from 'mongoose';

interface IMatchPlayed extends Document {
    raceId: string;
    player1: string;
    player2: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const MatchPlayedSchema = new Schema<IMatchPlayed>({
    raceId: { type: String, required: true },
    player1: { type: String, required: true },
    player2: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model<IMatchPlayed>('MatchPlayed', MatchPlayedSchema);