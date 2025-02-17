"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateRabbitHoleProgress = exports.triggers = void 0;
const triggers = [
    "rabbithole-preview-complete",
    "rabbithole-rules-complete",
    "rabbithole-reach",
    "rabbithole-eliminate",
    "rabbithole-set-fuel",
    "rabbithole-complete",
    "rabbithole-wait-to-finish"
];
exports.triggers = triggers;
const updateRabbitHoleProgress = (property, value, rProgress, version) => {
    switch (property) {
        case "rabbithole-preview-complete":
            // @ts-ignore
            rProgress.progress.rabbithole[version].preview = true;
            break;
        case "rabbithole-rules-complete":
            // @ts-ignore
            rProgress.progress.rabbithole[version].rules = true;
            break;
        case "rabbithole-reach": {
            // @ts-ignore
            rProgress.progress.rabbithole[version] = Object.assign(Object.assign({}, rProgress.progress.rabbithole[version]), { game: Object.assign(Object.assign({}, rProgress.progress.rabbithole[version].game), { gameReached: true }) });
            break;
        }
        case "rabbithole-eliminate":
            // @ts-ignore
            rProgress.progress.rabbithole[version].game.isEliminated = true;
            break;
        case "rabbithole-set-fuel":
            // @ts-ignore
            rProgress.progress.rabbithole[version] = Object.assign(Object.assign({}, rProgress.progress.rabbithole[version]), { game: Object.assign(Object.assign({}, rProgress.progress.rabbithole[version].game), { fuel: value.fuel, maxAvailableFuel: value.maxAvailableFuel, isPending: value.isPending || false }) });
            break;
        case "rabbithole-complete":
            // @ts-ignore
            rProgress.progress.rabbithole[version] = Object.assign(Object.assign({}, rProgress.progress.rabbithole[version]), { game: Object.assign(Object.assign({}, rProgress.progress.rabbithole[version].game), { isCompleted: true, isWon: value.isWon, pointsAllocated: value.pointsAllocated }) });
            break;
        case "rabbithole-wait-to-finish": {
            // @ts-ignore
            rProgress.progress.rabbithole[version].game.waitingToFinish = true;
            break;
        }
        default:
            break;
    }
    return rProgress;
};
exports.updateRabbitHoleProgress = updateRabbitHoleProgress;
