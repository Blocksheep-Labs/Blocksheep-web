import type { PayloadAction } from "@reduxjs/toolkit";
import { createAppSlice } from "../../app/createAppSlice";
import type { AppThunk } from "../../app/store";
import { update } from "@react-spring/web";
import { fetchGameResult, fetchGames } from "./gameAPI";
import { Wallet } from "ethers";

// export interface CounterSliceState {
//   value: number;
//   status: "idle" | "loading" | "failed";
// }

export interface GameScoreState {
  allScore: number[];
  allCredit: number[];
}

/*
{
  userAddress: "0x123",
  activeRace: 1,
  activeQuestion: 1,
  gameStatus: 2,
  games: [
    gameId: "1",
    endAt: "123",
    numberOfQuestions: "2",
    questions: [
      {
        question1: {
          questionId: "1",
          draw: "1",
          distributed: "1",
          answeredPlayerCount: "1",
          playersByAnswer: {
            0: ["0x123", "0x456"],
            1: ["0x789", "0xabc"],
          },
          answered: {
            "0x123": "0",
            "0x456": "0",
            "0x789": "1",
            "0xabc": "1",
          },
        },
      },
      {
        question2: {
          questionId: "2",
          draw: "1",
          distributed: "1",
          answeredPlayerCount: "1",
          playersByAnswer: {
            0: ["0x123", "0x456"],
            1: ["0x789", "0xabc"],
          },
          answered: {
            "0x123": "0",
            "0x456": "0",
            "0x789": "1",
            "0xabc": "1",
          },
        },
      },
    ],

  ]
}
*/
export interface SystemState {
  allScore: number[];
  allCredit: number[];
  userAddress: string;
  activeRace: number;
  activeQuestion: number;
  gameStatus: number;
  games: {
    gameId: string;
    endAt: string;
    numberOfQuestions: string;
    questions: {
      question1: {
        questionId: string;
        draw: string;
        distributed: string;
        answeredPlayerCount: string;
        playersByAnswer: {
          0: string[];
          1: string[];
        };
        answered: {
          [key: string]: string;
        };
      };
    };
  };
}

const initialState: SystemState = {
  allScore,
  allCredit,
  userAddress: "",
  activeRace: 0,
  activeQuestion: 0,
  gameStatus: 0,
  games: {
    gameId: "",
    endAt: "",
    numberOfQuestions: "",
    questions: {
      question1: {
        questionId: "",
        draw: "",
        distributed: "",
        answeredPlayerCount: "",
        playersByAnswer: {
          0: [],
          1: [],
        },
        answered: {},
      },
    },
  },
};

export const gameSlice = createAppSlice({
  name: "game",
  initialState,
  reducers: (create) => ({
    //update games result
    // updateGameResult: create.reducer((state, action: PayloadAction<number>) => {}),
    updateGameResult: create.asyncThunk(
      async (race: number) => {
        const response = await fetchGameResult(race, 1);
        return response.data;
      },
      {
        pending: (state) => {
          console.log("pending");
        },
        fulfilled: (state, action) => {
          console.log("fulfilled");
        },
        rejected: (state) => {
          console.log("rejected");
        },
      },
    ),
    //update games
    updateGames: create.asyncThunk(
      async (race: number) => {
        const response = await fetchGames(race, 1);
        return response.data;
      },
      {
        pending: (state) => {
          console.log("pending");
        },
        fulfilled: (state) => {
          console.log("fulfilled");
        },
        rejected: (state) => {
          console.log("rejected");
        },
      },
    ),
  }),

  selectors: {
    selectAllScore: (state) => state.allScore,
    selectAllCredit: (state) => state.allCredit,
    selectCActiveRace: (state) => state.activeRace,
    selectActiveQuestion: (state) => state.activeQuestion,
    selectGameStatus: (state) => state.gameStatus,
  },
});

export const { updateGameResult, updateGames } = gameSlice.actions;

export const { selectAllScore, selectAllCredit } = gameSlice.selectors;
