import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import Modal from "react-modal";
import { BrowserRouter } from "react-router-dom";
const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
import { TenTestnet } from "@thirdweb-dev/chains";
import { ThirdwebProvider } from "@thirdweb-dev/react";
root.render(
  <React.StrictMode>
    <ThirdwebProvider activeChain={TenTestnet} clientId={import.meta.env.THIRDWEB_CLIENT_ID}>
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
