"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// default
const connected_user_mongo_1 = __importDefault(require("./default/connected-user.mongo"));
const race_progress_mongo_1 = __importDefault(require("./default/race-progress.mongo"));
const screen_mongo_1 = __importDefault(require("./default/screen.mongo"));
const player_points_1 = __importDefault(require("./default/player-points"));
// bullrun
const game_counts_mongo_1 = __importDefault(require("./bullrun/game-counts.mongo"));
const games_completes_mongo_1 = __importDefault(require("./bullrun/games-completes.mongo"));
const games_required_mongo_1 = __importDefault(require("./bullrun/games-required.mongo"));
const in_game_players_mongo_1 = __importDefault(require("./bullrun/in-game-players.mongo"));
const matches_played_mongo_1 = __importDefault(require("./bullrun/matches-played.mongo"));
const players_state_mongo_1 = __importDefault(require("./bullrun/players-state.mongo"));
// underdog
const questions_state_mongo_1 = __importDefault(require("./underdog/questions-state.mongo"));
// rabbithole
const tunnel_state_mongo_1 = __importDefault(require("./rabbithole/tunnel-state.mongo"));
const modules = {
    default: {
        ConnectedUser: connected_user_mongo_1.default,
        RaceProgress: race_progress_mongo_1.default,
        Screen: screen_mongo_1.default,
        PlayerPoints: player_points_1.default,
    },
    bullrun: {
        GameCounts: game_counts_mongo_1.default,
        GameCompletes: games_completes_mongo_1.default,
        GamesRequired: games_required_mongo_1.default,
        InGamePlayers: in_game_players_mongo_1.default,
        MatchesPlayed: matches_played_mongo_1.default,
        PlayersState: players_state_mongo_1.default,
    },
    underdog: {
        QuestionsState: questions_state_mongo_1.default,
    },
    rabbithole: {
        TunnelState: tunnel_state_mongo_1.default,
    },
};
exports.default = modules;
