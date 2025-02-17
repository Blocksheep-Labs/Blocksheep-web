const triggers = [
    "game2-preview-complete", 
    "game2-rules-complete", 
    "game2-reach", 
    "game2-eliminate", 
    "game2-set-fuel", 
    "game2-complete", 
    "game2-wait-to-finish"
];

const updateRabbitHoleProgress = (property, value, rProgress, version) => {
    switch (property) {
        case "game2-preview-complete":
            rProgress.progress.game2[version].preview = true;
            break;
        case "game2-rules-complete":
            rProgress.progress.game2[version].rules = true;
            break;
        case "game2-reach": {
            rProgress.progress.game2[version] = {
                ...rProgress.progress.game2[version],
                game: {
                    ...rProgress.progress.game2[version].game,
                    gameReached: true,
                }
            };
            break;
        }
        case "game2-eliminate": 
            rProgress.progress.game2[version].game.isEliminated = true;
            // console.log("eliminated!", rProgress.userAddress);
            break;
        case "game2-set-fuel":
            //console.log("UPDATE FUEL", { ...value }, rProgress.userAddress);
            
            rProgress.progress.game2[version] = {
                ...rProgress.progress.game2[version],
                game: {
                    ...rProgress.progress.game2[version].game,
                    fuel: value.fuel,
                    maxAvailableFuel: value.maxAvailableFuel,
                    isPending: value.isPending || false,
                }
            };

            //console.log("UPDATE FUEL", rProgress.progress.game2[version].game)

            break;
        case "game2-complete": 
            rProgress.progress.game2[version] = {
                ...rProgress.progress.game2[version],
                game: {
                    ...rProgress.progress.game2[version].game,
                    isCompleted: true,
                    isWon: value.isWon,
                    pointsAllocated: value.pointsAllocated,
                }
            }
            break;
        case "game2-wait-to-finish": {
            rProgress.progress.game2[version].game.waitingToFinish = true;
            break;
        }
        default:
            break;
    }

    return rProgress;
}

module.exports = {
    triggers, 
    updateRabbitHoleProgress,
}