import mongoose, { Document, Schema } from 'mongoose';

interface ITunnelState extends Document {
    room: string;
    secondsLeft: number;
    roundsPlayed: number;
}

const TunnelStateSchema: Schema<ITunnelState> = new Schema({
    room: String,
    secondsLeft: Number,
    roundsPlayed: Number,
});

export default mongoose.model<ITunnelState>('TunnelState', TunnelStateSchema);
