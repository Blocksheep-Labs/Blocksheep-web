interface Underdog {
    waitingAfterFinish: boolean;
    waitingToFinish: boolean;
    isDistributed: boolean;
    completed: number;
    of: number;
    answers: string;
    lastAnswerIsConfirmed: boolean;
}

interface Config {
    underdog_preview: boolean;
    underdog_rules: boolean;
    underdog: Underdog;
}

const config: Config = {
    underdog_preview: false,
    underdog_rules: false,
    underdog: {
        waitingAfterFinish: false,
        waitingToFinish: false,
        isDistributed: false,
        completed: 0,
        of: 0,
        answers: "",
        lastAnswerIsConfirmed: true,
    },
};

export default config;
