import config from "../default-states-by-games/rabbithole";


interface UpdateValue {
    fuel?: number;
    maxAvailableFuel?: number;
    isPending?: boolean;
    isWon?: boolean;
    pointsAllocated?: number;
}

interface RProgress {
    progress: typeof config;
}


const triggers: string[] = [
    "rabbithole-preview-complete",
    "rabbithole-rules-complete",
    "rabbithole-reach",
    "rabbithole-eliminate",
    "rabbithole-set-fuel",
    "rabbithole-complete",
    "rabbithole-wait-to-finish"
];

const updateRabbitHoleProgress = (
    property: string,
    raceId: number,
    value: UpdateValue,
    rProgress: RProgress,
    version: string
): RProgress => {

    switch (property) {
        case "rabbithole-preview-complete":
            // @ts-ignore
            rProgress.progress.rabbithole[version].preview = true;
            break;
        case "rabbithole-rules-complete":
            // @ts-ignore
            rProgress.progress.rabbithole[version].rules = true;
            break;
        case "rabbithole-reach": {
            // @ts-ignore
            rProgress.progress.rabbithole[version] = {
                // @ts-ignore
                ...rProgress.progress.rabbithole[version],
                game: {
                    // @ts-ignore
                    ...rProgress.progress.rabbithole[version].game,
                    gameReached: true,
                }
            };
            break;
        }
        case "rabbithole-eliminate":
            // @ts-ignore
            rProgress.progress.rabbithole[version].game.isEliminated = true;
            break;
        case "rabbithole-set-fuel":
            // @ts-ignore
            console.log("rabbithole-set-fuel", value.fuel, rProgress.userAddress);
            // @ts-ignore
            rProgress.progress.rabbithole[version] = {
                // @ts-ignore
                ...rProgress.progress.rabbithole[version],
                game: {
                    // @ts-ignore
                    ...rProgress.progress.rabbithole[version].game,
                    fuel: value.fuel!,
                    maxAvailableFuel: value.maxAvailableFuel!,
                    isPending: value.isPending || false,
                }
            };
            break;
        case "rabbithole-complete":
            // @ts-ignore
            rProgress.progress.rabbithole[version] = {
                // @ts-ignore
                ...rProgress.progress.rabbithole[version],
                game: {
                    // @ts-ignore
                    ...rProgress.progress.rabbithole[version].game,
                    isCompleted: true,
                    isWon: value.isWon!,
                    pointsAllocated: value.pointsAllocated!,
                }
            };
            break;
        case "rabbithole-wait-to-finish": {
            // @ts-ignore
            rProgress.progress.rabbithole[version].game.waitingToFinish = true;
            break;
        }
        default:
            break;
    }

    return rProgress;
};

export { triggers, updateRabbitHoleProgress };
