interface Game {
    waitingToFinish: boolean;
    isCompleted: boolean;
    fuel: number;
    maxAvailableFuel: number;
    isWon: boolean;
    isPending: boolean;
    gameReached: boolean;
    isEliminated: boolean;
    pointsAllocated: number;
}

interface Version {
    preview: boolean;
    rules: boolean;
    game: Game;
}

interface Rabbithole {
    v1: Version;
    v2: Version;
}

const config: { rabbithole: Rabbithole } = {
    rabbithole: {
        v1: {
            preview: false,
            rules: false,
            game: {
                waitingToFinish: false,
                isCompleted: false,
                fuel: 0,
                maxAvailableFuel: 10,
                isWon: false,
                isPending: false,
                gameReached: false,
                isEliminated: false,
                pointsAllocated: 0,
            },
        },
        v2: {
            preview: false,
            rules: false,
            game: {
                waitingToFinish: false,
                isCompleted: false,
                fuel: 0,
                maxAvailableFuel: 10,
                isWon: false,
                isPending: false,
                gameReached: false,
                isEliminated: false,
                pointsAllocated: 0,
            },
        }
    }
};

export default config;
