const triggers = [
    "rabbithole-preview-complete", 
    "rabbithole-rules-complete", 
    "rabbithole-reach", 
    "rabbithole-eliminate", 
    "rabbithole-set-fuel", 
    "rabbithole-complete", 
    "rabbithole-wait-to-finish"
];

const updateRabbitHoleProgress = (property, value, rProgress, version) => {
    switch (property) {
        case "rabbithole-preview-complete":
            rProgress.progress.rabbithole[version].preview = true;
            break;
        case "rabbithole-rules-complete":
            rProgress.progress.rabbithole[version].rules = true;
            break;
        case "rabbithole-reach": {
            rProgress.progress.rabbithole[version] = {
                ...rProgress.progress.rabbithole[version],
                game: {
                    ...rProgress.progress.rabbithole[version].game,
                    gameReached: true,
                }
            };
            break;
        }
        case "rabbithole-eliminate": 
            rProgress.progress.rabbithole[version].game.isEliminated = true;
            // console.log("eliminated!", rProgress.userAddress);
            break;
        case "rabbithole-set-fuel":
            //console.log("UPDATE FUEL", { ...value }, rProgress.userAddress);
            
            rProgress.progress.rabbithole[version] = {
                ...rProgress.progress.rabbithole[version],
                game: {
                    ...rProgress.progress.rabbithole[version].game,
                    fuel: value.fuel,
                    maxAvailableFuel: value.maxAvailableFuel,
                    isPending: value.isPending || false,
                }
            };

            //console.log("UPDATE FUEL", rProgress.progress.rabbithole[version].game)

            break;
        case "rabbithole-complete": 
            rProgress.progress.rabbithole[version] = {
                ...rProgress.progress.rabbithole[version],
                game: {
                    ...rProgress.progress.rabbithole[version].game,
                    isCompleted: true,
                    isWon: value.isWon,
                    pointsAllocated: value.pointsAllocated,
                }
            }
            break;
        case "rabbithole-wait-to-finish": {
            rProgress.progress.rabbithole[version].game.waitingToFinish = true;
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