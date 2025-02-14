import mongoose, { Document, Schema } from 'mongoose';

interface IScreen extends Document {
    raceId: string;
    screens: string[];
    latestScreen: string;
    room: string;
}

const ScreenSchema: Schema<IScreen> = new Schema({
    raceId: String,
    screens: [String],
    latestScreen: String,
    room: String,
});

export default mongoose.model<IScreen>('Screen', ScreenSchema);
