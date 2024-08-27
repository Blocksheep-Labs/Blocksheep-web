module.exports = (property, value, rProgress) => {
    switch (property) {
        case "countdown":
            rProgress.progress.countdown = true;
            break;
        case "board1":
            rProgress.progress.board1 = true;
            break;
        case "game1++":
            rProgress.progress.game1 = {
                ...rProgress.progress.game1,
                completed: rProgress.progress.game1.completed + 1,
                of: value.of,
                answers: [...rProgress.progress.game1.answers, value.answer]
            }
            break;
        case "game1-wait-to-finish": {
            rProgress.progress.game1.waitingToFinish = true;
        }
        case "game1-distribute":
            rProgress.progress.game1 = {
                ...rProgress.progress.game1,
                isDistributed: true,
            }
            break;
        case "game2-reach": {
            rProgress.progress.game2 = {
                ...rProgress.progress.game2,
                gameReached: true,
            }
            break;
        }
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
            }
            break;
        default:
            break;
    }

    return rProgress;
}