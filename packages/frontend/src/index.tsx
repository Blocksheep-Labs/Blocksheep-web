import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import Modal from "react-modal";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { PrivyProvider } from "@privy-io/react-auth";
import { config } from "./config/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from '@privy-io/wagmi';
import { SmartAccountProvider } from "./hooks/smartAccountProvider";
import { PRIVY_APP_ID, SELECTED_NETWORK } from "./config/constants";
import { GameProvider } from "./utils/game-context";


const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
const queryClient = new QueryClient();

root.render(
  <PrivyProvider 
    appId={PRIVY_APP_ID || ""}
    config={{
      loginMethods: ["email", "wallet"],
      appearance: {
        theme: 'light',
        
      },
      embeddedWallets: {
        createOnLogin: "all-users",
        noPromptOnSignature: true,
      },
      defaultChain: SELECTED_NETWORK,
      supportedChains: [SELECTED_NETWORK]
    }}
  >
    <SmartAccountProvider>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <GameProvider>
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </GameProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </SmartAccountProvider>
  </PrivyProvider>
);

Modal.setAppElement("#root");

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();
