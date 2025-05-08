import mongoose, { Document, Schema } from 'mongoose';

interface IConnectedUser extends Document {
    room: string;
    id: string;
    userAddress: string;
    part: string;
    raceId: number;
}

const ConnectedUserSchema: Schema<IConnectedUser> = new Schema({
    room: String,
    id: String,
    userAddress: String,
    part: String,
    raceId: Number,
});

export default mongoose.model<IConnectedUser>('ConnectedUser', ConnectedUserSchema);
