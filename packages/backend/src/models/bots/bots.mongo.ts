import mongoose, {Document, Schema} from "mongoose";

interface IBot extends Document {
    address: string;
    connectedRaceIds: string[];
    usersGameMapping: Map<string, string>; // user address -> game name
    isMakingMoveMap: Map<string, boolean>;
    isDistributingMap: Map<string, boolean>;
    underdogPassedQuestionIndexes: Map<string, number[]>;
    rabbitholeRoundsPlayed: Map<string, number[]>;
    bullrunOpponentsPassed: Map<string, string[]>;
    bullrunPlaying: Map<string, boolean>;
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
        default: {},
    },

    rabbitholeRoundsPlayed: {
        type: Map,
        of: [Number],
        default: {},
    },

    bullrunOpponentsPassed: {
        type: Map,
        of: [String],
        default: {},
    },
    bullrunPlaying: {
        type: Map,
        of: [Boolean],
        default: {},
    }
}, { timestamps: true });

export default mongoose.model<IBot>("Bot", botsSchema);
