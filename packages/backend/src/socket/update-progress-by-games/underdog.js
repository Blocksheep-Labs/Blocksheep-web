const triggres = [
    "game1-preview-complete", 
    "game1-rules-complete", 
    "game1++", 
    "game1-wait-to-finish", 
    "game1-distribute",
    "game1-confirm-last-answer",
];


const updateUnderdogProgress = (property, value, rProgress) => {
    switch (property) {
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
                    answers: rProgress.progress.game1.answers + value.answer,
                    lastAnswerIsConfirmed: false,
                }
            } else {
                rProgress.progress.game1 = {
                    ...rProgress.progress.game1,
                    completed: rProgress.progress.game1.completed + 1,
                    of: value.of
                }
            }
            break;
        case "game1-confirm-last-answer": {
            console.log("confirm", property, value)
            rProgress.progress.game1 = {
                ...rProgress.progress.game1,
                lastAnswerIsConfirmed: true,
            }
        }
        case "game1-wait-to-finish": {
            console.log("game1-wait-to-finish")
            rProgress.progress.game1.waitingToFinish = true;
        }
        case "game1-wait-after-finish": {
            console.log("game1-wait-after-finish")
            rProgress.progress.game1.waitingAfterFinish = true;
        }
        case "game1-distribute":
            rProgress.progress.game1 = {
                ...rProgress.progress.game1,
                isDistributed: true,
            }
            break;
        default:
            break;
    }

    return rProgress;
}


module.exports = {
    triggres,
    updateUnderdogProgress,
}