import mongoose, { Document, Schema } from 'mongoose';

interface IPlayerPoints extends Document {
    room: string;
    userAddress: string;
    points: number;
    finished: boolean;
}

const PlayerPointsSchema: Schema<IPlayerPoints> = new Schema({
    room: String,
    userAddress: String,
    points: Number,
    finished: Boolean,
});

export default mongoose.model<IPlayerPoints>('PlayerPoints', PlayerPointsSchema);