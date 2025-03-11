interface Bullrun {
    gamesPlayed: number;
    selectedItems: any[];
    points: number[];
    isCompleted: boolean;
}

interface Config {
    bullrun_preview: boolean;
    bullrun_rules: boolean;
    bullrun: Bullrun;
}

const config: Config = {
    bullrun_preview: false,
    bullrun_rules: false,
    bullrun: {
        gamesPlayed: 0,
        selectedItems: [],
        points: [],
        isCompleted: false,
    }
};

export default config;
