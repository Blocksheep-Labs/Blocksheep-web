import config from "../default-states-by-games/bullrun";

interface RProgress {
    progress: typeof config;
}

interface UpdateValue {
    item?: string;
    point?: number;
}

const triggers: string[] = [
    "bullrun-preview-complete",
    "bullrun-rules-complete",
    "bullrun-complete",
    "bullrun-add-item",
];

const updateBullrunProgress = (
    property: string,
    raceId: number,
    value: UpdateValue,
    rProgress: RProgress
): RProgress => {
    switch (property) {
        case "bullrun-preview-complete":
            rProgress.progress.bullrun_preview = true;
            break;
        case "bullrun-rules-complete":
            rProgress.progress.bullrun_rules = true;
            break;
        case "bullrun-complete":
            rProgress.progress.bullrun.isCompleted = true;
            break;
        case "bullrun-add-item":
            if (value.item) {
                rProgress.progress.bullrun.selectedItems.push(value.item);
            }
            break;
        case "bullrun-set-points":
            if (value.point !== undefined) {
                rProgress.progress.bullrun.points.push(value.point);
            }
            break;
        default:
            break;
    }

    return rProgress;
};

export { triggers, updateBullrunProgress };
