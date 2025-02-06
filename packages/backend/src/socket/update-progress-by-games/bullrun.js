const triggers = [
    "bullrun-preview-complete",
    "bullrun-rules-complete",
    "bullrun-complete",
    "bullrun-add-item",
];


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
            rProgress.progress.bullrun.selectedItems.push(value.item);
            break;
        case "bullrun-set-points":
            rProgress.progress.bullrun.points.push(value.point);
        
        default:
            break;
    }

    return rProgress;
}

module.exports = {
    triggers,
    updateBullrunProgress,
}