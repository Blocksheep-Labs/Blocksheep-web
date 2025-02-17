"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUnderdogProgress = exports.triggers = void 0;
const triggers = [
    "underdog-preview-complete",
    "underdog-rules-complete",
    "underdog++",
    "underdog-wait-to-finish",
    "underdog-distribute",
    "underdog-confirm-last-answer",
];
exports.triggers = triggers;
const updateUnderdogProgress = (property, value, rProgress) => {
    switch (property) {
        case "underdog-preview-complete":
            rProgress.progress.underdog_preview = true;
            break;
        case "underdog-rules-complete":
            rProgress.progress.underdog_rules = true;
            break;
        case "underdog++":
            if (value.answer && value.answer.toString().length) {
                console.log("+ANSW", value.answer, rProgress.progress.underdog.answers + value.answer);
                rProgress.progress.underdog = Object.assign(Object.assign({}, rProgress.progress.underdog), { completed: rProgress.progress.underdog.completed + 1, of: value.of, answers: rProgress.progress.underdog.answers + value.answer, lastAnswerIsConfirmed: false });
            }
            else {
                rProgress.progress.underdog = Object.assign(Object.assign({}, rProgress.progress.underdog), { completed: rProgress.progress.underdog.completed + 1, of: value.of });
            }
            break;
        case "underdog-confirm-last-answer": {
            console.log("confirm", property, value);
            rProgress.progress.underdog = Object.assign(Object.assign({}, rProgress.progress.underdog), { lastAnswerIsConfirmed: true });
            break;
        }
        case "underdog-wait-to-finish": {
            console.log("underdog-wait-to-finish");
            rProgress.progress.underdog.waitingToFinish = true;
            break;
        }
        case "underdog-wait-after-finish": {
            console.log("underdog-wait-after-finish");
            rProgress.progress.underdog.waitingAfterFinish = true;
            break;
        }
        case "underdog-distribute":
            rProgress.progress.underdog = Object.assign(Object.assign({}, rProgress.progress.underdog), { isDistributed: true });
            break;
        default:
            break;
    }
    return rProgress;
};
exports.updateUnderdogProgress = updateUnderdogProgress;
