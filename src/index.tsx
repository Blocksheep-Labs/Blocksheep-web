import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import Modal from "react-modal";
import { BrowserRouter } from "react-router-dom";
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
import {
  ThirdwebProvider,
  coinbaseWallet,
  localWallet,
  metamaskWallet,
  smartWallet,
} from "@thirdweb-dev/react";
import { ArbitrumSepolia } from "@thirdweb-dev/chains";
const factoryAddress = "0x30f88a75E13672722EF90086143F823A552F20fB";

export const smartWalletConfig = smartWallet(localWallet(), {
  factoryAddress,
  gasless: true,
});

root.render(
  <React.StrictMode>
    <ThirdwebProvider
      activeChain={ArbitrumSepolia}
      clientId={import.meta.env.VITE_THIRDWEB_CLIENT_ID}
      supportedWallets={[metamaskWallet(), coinbaseWallet(), smartWalletConfig]}
    >
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ThirdwebProvider>
  </React.StrictMode>,
);

Modal.setAppElement("#root");

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();
