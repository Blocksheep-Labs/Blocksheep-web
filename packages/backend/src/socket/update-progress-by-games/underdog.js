const triggres = [
    "underdog-preview-complete", 
    "underdog-rules-complete", 
    "underdog++", 
    "underdog-wait-to-finish", 
    "underdog-distribute",
    "underdog-confirm-last-answer",
];


const updateUnderdogProgress = (property, value, rProgress) => {
    switch (property) {
        case "underdog-preview-complete":
            rProgress.progress.underdog_preview = true;
            break;
        case "underdog-rules-complete":
            rProgress.progress.underdog_rules = true;
            break;
        case "underdog++":
            if (value.answer.toString().length) {
                console.log("+ANSW", value.answer, rProgress.progress.underdog.answers + value.answer)
                rProgress.progress.underdog = {
                    ...rProgress.progress.underdog,
                    completed: rProgress.progress.underdog.completed + 1,
                    of: value.of,
                    answers: rProgress.progress.underdog.answers + value.answer,
                    lastAnswerIsConfirmed: false,
                }
            } else {
                rProgress.progress.underdog = {
                    ...rProgress.progress.underdog,
                    completed: rProgress.progress.underdog.completed + 1,
                    of: value.of
                }
            }
            break;
        case "underdog-confirm-last-answer": {
            console.log("confirm", property, value)
            rProgress.progress.underdog = {
                ...rProgress.progress.underdog,
                lastAnswerIsConfirmed: true,
            }
        }
        case "underdog-wait-to-finish": {
            console.log("underdog-wait-to-finish")
            rProgress.progress.underdog.waitingToFinish = true;
        }
        case "underdog-wait-after-finish": {
            console.log("underdog-wait-after-finish")
            rProgress.progress.underdog.waitingAfterFinish = true;
        }
        case "underdog-distribute":
            rProgress.progress.underdog = {
                ...rProgress.progress.underdog,
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