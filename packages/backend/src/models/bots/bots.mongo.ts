import mongoose, {Document, Schema} from "mongoose";

interface IBot extends Document {
    address: string;
    connectedRaceIds: string[];
    usersGameMapping: Map<number, string>; // user address -> game name
    isMakingMoveMap: Map<number, boolean>;
    isDistributingMap: Map<number, boolean>;
    underdogPassedQuestionIndexes: Map<number, number[]>;
}

const botsSchema: Schema<IBot> = new Schema({
    address: {
        type: String,
        required: true,
    },

    connectedRaceIds: [{
        type: String,
        default: [],
    }],

    usersGameMapping: {
        type: Map,
        of: String,
        default: {},
    },

    isMakingMoveMap: {
        type: Map,
        of: Boolean,
        default: {},
    },

    isDistributingMap: {
        type: Map,
        of: Boolean,
        default: {},
    },

    underdogPassedQuestionIndexes: {
        type: Map,
        of: [Number],
        default: {}
    }
}, { timestamps: true });

export default mongoose.model<IBot>("Bot", botsSchema);
