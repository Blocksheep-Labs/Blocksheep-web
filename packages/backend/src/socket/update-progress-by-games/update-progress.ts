import { triggers as bullrunTriggers, updateBullrunProgress } from "./game-state-updaters/bullrun";
import { triggers as rabbitHoleTriggers, updateRabbitHoleProgress } from "./game-state-updaters/rabbithole";
import { triggers as underdogTriggers, updateUnderdogProgress } from "./game-state-updaters/underdog";


type Property =
    | "countdown"
    | "board1"
    | "board2"
    | "board3"
    | "board4"
    | "set-nickname"
    | "story-intro"
    | "story-part1"
    | "story-part2"
    | "story-part3"
    | "story-part4"
    | "story-conclusion";


interface UpdateProgressFn {
    (
        property: Property,
        value: any,
        rProgress: any,
        raceId: number,
    ): any;
}

export const updateProgress: UpdateProgressFn = (
    property,
    value,
    rProgress,
    raceId,
) => {
    if (underdogTriggers.includes(property)) {
        return updateUnderdogProgress(property, raceId, value, rProgress);
    }

    if (rabbitHoleTriggers.includes(property)) {
        return updateRabbitHoleProgress(property, raceId, value, rProgress);
    }

    if (bullrunTriggers.includes(property)) {
        return updateBullrunProgress(property, raceId, value, rProgress);
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
