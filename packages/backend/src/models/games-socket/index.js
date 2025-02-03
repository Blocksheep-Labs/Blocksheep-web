const ActivePlayer = require('./active-players.mongo');
const ConnectedUser = require('./connected-user.mongo');
const QuestionsState = require('./questions-state.mongo');
const RaceProgress = require('./race-progress.mongo');
const Screen = require('./screen.mongo');
const TunnelState = require('./tunnel-state.mongo');
const WaitingPlayer = require('./waiting-players.mongo');
const PlayerPoints = require('./player-points');

module.exports = {
    ActivePlayer,
    ConnectedUser,
    QuestionsState,
    RaceProgress,
    Screen,
    TunnelState,
    WaitingPlayer,
    PlayerPoints,
}