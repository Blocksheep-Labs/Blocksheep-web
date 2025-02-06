// default
const ConnectedUser = require('./default/connected-user.mongo');
const RaceProgress = require('./default/race-progress.mongo');
const Screen = require('./default/screen.mongo');
const PlayerPoints = require('./default/player-points');


// bullrun
const ActivePlayer = require('./bullrun/active-players.mongo');
const GameCounts = require('./bullrun/game-counts.mongo');
const GameCompletes = require('./bullrun/games-completes.mongo');
const GamesRequired = require('./bullrun/games-required.mongo');
const InGamePlayers = require('./bullrun/in-game-players.mongo');
const MatchesPlayed = require('./bullrun/matches-played.mongo');
const WaitingPlayer = require('./bullrun/waiting-players.mongo');
const PlayersState = require('./bullrun/players-state.mongo');

// underdog
const QuestionsState = require('./underdog/questions-state.mongo');


// rabbithole
const TunnelState = require('./rabbithole/tunnel-state.mongo');



module.exports = {
    default: {
        ConnectedUser,
        RaceProgress,
        Screen,
        PlayerPoints,
    },

    bullrun: {
        ActivePlayer,
        GameCounts,
        GameCompletes,
        GamesRequired,
        InGamePlayers,
        MatchesPlayed,
        WaitingPlayer,
        PlayersState,
    },

    underdog: {
        QuestionsState,
    },

    rabbithole: {
        TunnelState
    }
}