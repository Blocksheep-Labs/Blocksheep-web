import mongoose, { Document, Schema } from 'mongoose';

interface IConnectedUser extends Document {
    room: string;
    id: string;
    userAddress: string;
}

const ConnectedUserSchema: Schema<IConnectedUser> = new Schema({
    room: String,
    id: String,
    userAddress: String,
});

export default mongoose.model<IConnectedUser>('ConnectedUser', ConnectedUserSchema);
