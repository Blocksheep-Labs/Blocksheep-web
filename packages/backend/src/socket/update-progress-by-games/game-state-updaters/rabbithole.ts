import config from "../default-states-by-games/rabbithole";
import handleUserChoiceWithBot from "../../../utils/botGameHandlers";
import botsSchema from "../../../models/bots/bots.mongo";


interface UpdateValue {
    fuel?: number;
    maxAvailableFuel?: number;
    isPending?: boolean;
    isWon?: boolean;
    pointsAllocated?: number;
    roundIndex?: number,
    leavedUsersAddresses?: string[],
    version: string,
}

interface RProgress {
    progress: typeof config;
    userAddress: string;
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
): RProgress => {

    switch (property) {
        case "rabbithole-preview-complete":
            // @ts-ignore
            rProgress.progress.rabbithole[value.version].preview = true;
            break;
        case "rabbithole-rules-complete":
            // @ts-ignore
            rProgress.progress.rabbithole[value.version].rules = true;
            break;
        case "rabbithole-reach": {
            // @ts-ignore
            rProgress.progress.rabbithole[value.version] = {
                // @ts-ignore
                ...rProgress.progress.rabbithole[value.version],
                game: {
                    // @ts-ignore
                    ...rProgress.progress.rabbithole[value.version].game,
                    gameReached: true,
                }
            };
            break;
        }
        case "rabbithole-eliminate":
            // @ts-ignore
            rProgress.progress.rabbithole[value.version].game.isEliminated = true;
            break;
        case "rabbithole-set-fuel":
            // @ts-ignore
            console.log("rabbithole-set-fuel", value.fuel, rProgress.userAddress);
            // @ts-ignore
            rProgress.progress.rabbithole[value.version] = {
                // @ts-ignore
                ...rProgress.progress.rabbithole[value.version],
                game: {
                    // @ts-ignore
                    ...rProgress.progress.rabbithole[value.version].game,
                    fuel: value.fuel!,
                    maxAvailableFuel: value.maxAvailableFuel!,
                    isPending: value.isPending || false,
                }
            };

            // bot makes move
            handleUserChoiceWithBot({
                type: "makeMove",
                game: "RABBITHOLE",
                raceId,
                data: {
                    roundIndex: value.roundIndex,
                    leavedUsersAddresses: value.leavedUsersAddresses,
                    version: value.version,
                }
            }).catch((err) => {
                console.log("Bot make move failed :(", err);
            });
            break;
        case "rabbithole-complete":
            // @ts-ignore
            rProgress.progress.rabbithole[value.version] = {
                // @ts-ignore
                ...rProgress.progress.rabbithole[value.version],
                game: {
                    // @ts-ignore
                    ...rProgress.progress.rabbithole[value.version].game,
                    isCompleted: true,
                    isWon: value.isWon!,
                    pointsAllocated: value.pointsAllocated!,
                }
            };

            handleUserChoiceWithBot({
                type: "distribute",
                game: "RABBITHOLE",
                raceId,
                data: {
                    version: value.version,
                }
            }).catch((err) => {
                console.log("Bot distribute failed :(", err);
            });
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
