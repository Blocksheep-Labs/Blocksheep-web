import mongoose, { Document, Schema } from 'mongoose';

interface IRaceProgress extends Document {
    room: string;
    userAddress: string;
    progress: Record<string, any>; // Adjust the type as needed based on the structure of progress
}

const RaceProgressSchema: Schema<IRaceProgress> = new Schema({
    room: String,
    userAddress: { type: String, unique: true },
    progress: Object,
});

export default mongoose.model<IRaceProgress>('RaceProgress', RaceProgressSchema);
