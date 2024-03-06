import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import Modal from "react-modal";
import { BrowserRouter } from "react-router-dom";
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
// import {  } from "@thirdweb-dev/chains";
import { ThirdwebProvider, metamaskWallet, smartWallet } from "@thirdweb-dev/react";

const factoryAddress = "0xD5B4Fc91C63F453d56CC43656B8E6584fEE84D65";

export const smartWalletConfig = smartWallet(metamaskWallet(), {
  factoryAddress,
  gasless: true,
});

root.render(
  <React.StrictMode>
    <ThirdwebProvider
      activeChain={"avalanche-fuji"}
      clientId={import.meta.env.THIRDWEB_CLIENT_ID}
      supportedWallets={[smartWalletConfig]}
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
