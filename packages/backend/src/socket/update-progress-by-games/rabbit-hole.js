const triggers = [
    "game2-preview-complete", 
    "game2-rules-complete", 
    "game2-reach", 
    "game2-eliminate", 
    "game2-set-fuel", 
    "game2-complete", 
    "game2-wait-to-finish"
];

const updateRabbitHoleProgress = (property, value, rProgress) => {
    switch (property) {
        case "game2-preview-complete":
            rProgress.progress.game2_preview = true;
            break;
        case "game2-rules-complete":
            rProgress.progress.game2_rules = true;
            break;
        case "game2-reach": {
            rProgress.progress.game2 = {
                ...rProgress.progress.game2,
                gameReached: true,
            }
            break;
        }
        case "game2-eliminate": 
            rProgress.progress.game2.isEliminated = true;
            break;
        case "game2-set-fuel":
            rProgress.progress.game2 = {
                ...rProgress.progress.game2,
                fuel: value.fuel,
                maxAvailableFuel: value.maxAvailableFuel,
                isPending: value.isPending || false,
            }
            break;
        case "game2-complete": 
            rProgress.progress.game2 = {
                ...rProgress.progress.game2,
                isCompleted: true,
                isWon: value.isWon,
                pointsAllocated: value.pointsAllocated,
            }
            break;
        case "game2-wait-to-finish": {
            rProgress.progress.game2.waitingToFinish = true;
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