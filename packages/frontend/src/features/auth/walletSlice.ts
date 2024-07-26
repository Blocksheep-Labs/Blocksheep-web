import type { PayloadAction } from "@reduxjs/toolkit";
import { createAppSlice } from "../../app/createAppSlice";
import type { AppThunk } from "../../app/store";
import { fetchWallet } from "./walletAPI";
import { selectCount } from "../counter/counterSlice";
import { RootState } from "../../app/store"; // Import RootState type

export interface WalletSliceState {
  wallet: any;
  status: "idle" | "loading" | "failed";
}

const initialState: WalletSliceState = {
  wallet: null,
  status: "idle",
};

export const walletSlice = createAppSlice({
  name: "wallet",
  initialState,
  reducers: (create) => ({
    setWallet: create.reducer((state, action: PayloadAction<any>) => {
      state.wallet = action.payload;
    }),
    disconnectWallet: create.reducer((state) => {
      state.wallet = null;
    }),
    connectWallet: create.asyncThunk(
      async () => {
        const reponse = await fetchWallet();
        return reponse.wallet;
      },
      {
        pending: (state) => {
          state.status = "loading";
        },
        fulfilled: (state, action) => {
          state.status = "idle";
          state.wallet = action.payload;
        },
        rejected: (state) => {
          state.status = "failed";
        },
      },
    ),
  }),

  selectors: {
    selectWallet: (state) => state.wallet,
    selectWalletStatus: (state) => state.status,
  },
});

// Action creators are generated for each case reducer function.
export const { disconnectWallet, setWallet, connectWallet } = walletSlice.actions;

export const { selectWallet, selectWalletStatus } = walletSlice.selectors;
// export const connectWalletIfNotConnected = (): AppThunk => (dispatch, getState) => {
//     const wallet = selectWallet(getState() as RootState); // Cast getState() to RootState
//     if (!wallet) {
//         dispatch(connectWallet());
//     }
//   }
// };