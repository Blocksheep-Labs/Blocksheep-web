const triggers = [
    "game3-preview-complete",
    "game3-rules-complete",
    "game3-enroll",
    "game3-complete",
    "game3-add-item",
];


const updateBullrunProgress = (property, value, rProgress) => {
    switch (property) {
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
    
        default:
            break;
    }

    return rProgress;
}

module.exports = {
    triggers,
    updateBullrunProgress,
}