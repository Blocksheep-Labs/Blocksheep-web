// default
import ConnectedUser from './default/connected-user.mongo';
import RaceProgress from './default/race-progress.mongo';
import Screen from './default/screen.mongo';
import PlayerPoints from './default/player-points';

// bullrun
import GameCounts from './bullrun/game-counts.mongo';
import GameCompletes from './bullrun/games-completes.mongo';
import GamesRequired from './bullrun/games-required.mongo';
import InGamePlayers from './bullrun/in-game-players.mongo';
import MatchesPlayed from './bullrun/matches-played.mongo';
import PlayersState from './bullrun/players-state.mongo';

// underdog
import QuestionsState from './underdog/questions-state.mongo';

// rabbithole
import TunnelState from './rabbithole/tunnel-state.mongo';

interface DefaultModules {
    ConnectedUser: typeof ConnectedUser;
    RaceProgress: typeof RaceProgress;
    Screen: typeof Screen;
    PlayerPoints: typeof PlayerPoints;
}

interface BullrunModules {
    GameCounts: typeof GameCounts;
    GameCompletes: typeof GameCompletes;
    GamesRequired: typeof GamesRequired;
    InGamePlayers: typeof InGamePlayers;
    MatchesPlayed: typeof MatchesPlayed;
    PlayersState: typeof PlayersState;
}

interface UnderdogModules {
    QuestionsState: typeof QuestionsState;
}

interface RabbitholeModules {
    TunnelState: typeof TunnelState;
}

const modules = {
    default: {
        ConnectedUser,
        RaceProgress,
        Screen,
        PlayerPoints,
    } as DefaultModules,

    bullrun: {
        GameCounts,
        GameCompletes,
        GamesRequired,
        InGamePlayers,
        MatchesPlayed,
        PlayersState,
    } as BullrunModules,

    underdog: {
        QuestionsState,
    } as UnderdogModules,

    rabbithole: {
        TunnelState,
    } as RabbitholeModules,
};

export default modules;