import mongoose, { Document, Schema } from 'mongoose';

interface IQuestionsState extends Document {
    room: string;
    index: number;
    secondsLeft: number;
}

const QuestionsStateSchema: Schema<IQuestionsState> = new Schema({
    room: String,
    index: Number,
    secondsLeft: Number,
});

export default mongoose.model<IQuestionsState>('QuestionsState', QuestionsStateSchema);
