"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProgress = void 0;
const bullrun_1 = require("./update-progress-by-games/bullrun");
const rabbithole_1 = require("./update-progress-by-games/rabbithole");
const underdog_1 = require("./update-progress-by-games/underdog");
const updateProgress = (property, value, rProgress, version) => {
    if (underdog_1.triggers.includes(property)) {
        return (0, underdog_1.updateUnderdogProgress)(property, value, rProgress);
    }
    if (rabbithole_1.triggers.includes(property)) {
        return (0, rabbithole_1.updateRabbitHoleProgress)(property, value, rProgress, version);
    }
    if (bullrun_1.triggers.includes(property)) {
        return (0, bullrun_1.updateBullrunProgress)(property, value, rProgress);
    }
    // Handling generic properties not part of the specific game progress
    switch (property) {
        case "countdown":
            rProgress.progress.countdown = true;
            break;
        case "board1":
            rProgress.progress.board1 = true;
            break;
        case "board2":
            rProgress.progress.board2 = true;
            break;
        case "board3":
            rProgress.progress.board3 = true;
            break;
        case "board4":
            rProgress.progress.board4 = true;
            break;
        case "set-nickname":
            rProgress.progress.nicknameSet = true;
            break;
        case "story-intro":
            rProgress.progress.story.intro = true;
            break;
        case "story-part1":
            rProgress.progress.story.part1 = true;
            break;
        case "story-part2":
            rProgress.progress.story.part2 = true;
            break;
        case "story-part3":
            rProgress.progress.story.part3 = true;
            break;
        case "story-part4":
            rProgress.progress.story.part4 = true;
            break;
        case "story-conclusion":
            rProgress.progress.story.conclusion = true;
            break;
        default:
            break;
    }
    return rProgress;
};
exports.updateProgress = updateProgress;
