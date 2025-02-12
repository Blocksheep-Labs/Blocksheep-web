"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBullrunProgress = exports.triggers = void 0;
const triggers = [
    "bullrun-preview-complete",
    "bullrun-rules-complete",
    "bullrun-complete",
    "bullrun-add-item",
];
exports.triggers = triggers;
const updateBullrunProgress = (property, value, rProgress) => {
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
exports.updateBullrunProgress = updateBullrunProgress;
