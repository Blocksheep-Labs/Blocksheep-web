const { triggers, updateBullrunProgress } = require("./update-progress-by-games/bullrun");
const { triggers: rabbitHoleTriggers, updateRabbitHoleProgress } = require("./update-progress-by-games/rabbit-hole");
const { triggres: underdogTriggers, updateUnderdogProgress } = require("./update-progress-by-games/underdog");


module.exports = (property, value, rProgress) => {
    if (underdogTriggers.includes(property)) {
        return updateUnderdogProgress(property, value, rProgress);
    }

    if (rabbitHoleTriggers.includes(property)) {
        return updateRabbitHoleProgress(property, value, rProgress);
    }

    if (triggers.includes(property)) {
        return updateBullrunProgress(property, value, rProgress);
    }


    switch (property) {
        case "countdown":
            rProgress.progress.countdown = true;
            break;
        case "board1":
            rProgress.progress.board1 = true;
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
}