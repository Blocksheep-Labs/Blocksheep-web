module.exports = (property, value, rProgress) => {
    switch (property) {
        case "countdown":
            rProgress.progress.countdown = true;
            break;
        case "board1":
            rProgress.progress.board1 = true;
            break;
        case "game1-preview-complete":
            rProgress.progress.game1_preview = true;
            break;
        case "game1-rules-complete":
            rProgress.progress.game1_rules = true;
            break;
        case "game1++":
            if (value.answer.toString().length) {
                console.log("+ANSW", value.answer, rProgress.progress.game1.answers + value.answer)
                rProgress.progress.game1 = {
                    ...rProgress.progress.game1,
                    completed: rProgress.progress.game1.completed + 1,
                    of: value.of,
                    answers: rProgress.progress.game1.answers + value.answer
                }
            } else {
                rProgress.progress.game1 = {
                    ...rProgress.progress.game1,
                    completed: rProgress.progress.game1.completed + 1,
                    of: value.of
                }
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
        case "game2-wait-to-finish": {
            rProgress.progress.game2.waitingToFinish = true;
        }
        case "game3-preview-complete":
            rProgress.progress.game3_preview = true;
            break;
        case "game3-rules-complete":
            rProgress.progress.game3_rules = true;
            break;
        case "game3-enroll": 
            rProgress.progress.game3.isPlaying = true;
            break;
        case "game3-complete": 
            rProgress.progress.game3.isPlaying = false;
            rProgress.progress.game3.isCompleted = true;
            break;
        case "game3-add-item": 
            rProgress.progress.game3.selectedItems.push(value.item);
            rProgress.progress.game3.points.push(value.point);
            break;
        case "game3-complete": 
            rProgress.progress.game3.isCompleted = true;
            break;
        default:
            break;
    }

    return rProgress;
}