"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config = {
    rabbithole: {
        v1: {
            preview: false,
            rules: false,
            game: {
                waitingToFinish: false,
                isCompleted: false,
                fuel: 0,
                maxAvailableFuel: 10,
                isWon: false,
                isPending: false,
                gameReached: false,
                isEliminated: false,
                pointsAllocated: 0,
            },
        },
        v2: {
            preview: false,
            rules: false,
            game: {
                waitingToFinish: false,
                isCompleted: false,
                fuel: 0,
                maxAvailableFuel: 10,
                isWon: false,
                isPending: false,
                gameReached: false,
                isEliminated: false,
                pointsAllocated: 0,
            },
        }
    }
};
exports.default = config;
