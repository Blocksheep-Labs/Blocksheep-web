import type { PayloadAction } from "@reduxjs/toolkit";
import { createAppSlice } from "../../app/createAppSlice";
import type { AppThunk } from "../../app/store";
import { update } from "@react-spring/web";
import { fetchGameResult, fetchGames } from "./gameAPI";
import { stat } from "fs";

// export interface CounterSliceState {
//   value: number;
//   status: "idle" | "loading" | "failed";
// }

export interface GameScoreState {
  allScore: number[];
  allCredit: number[];
}

const initialState: GameScoreState = {
  allScore: [],
  allCredit: [],
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
        fulfilled: (state, action) => {
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
  },
  
});

export const { updateGameResult, updateGames } = gameSlice.actions;

export const { selectAllScore, selectAllCredit } = gameSlice.selectors;


