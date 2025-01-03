import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import Modal from "react-modal";
import { BrowserRouter } from "react-router-dom";
import { PrivyProvider } from "@privy-io/react-auth";
import { config } from "./config/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from '@privy-io/wagmi';
import { SmartAccountProvider } from "./hooks/smartAccountProvider";
import { PRIVY_APP_ID, SELECTED_NETWORK, VITE_ENVIRONMENT } from "./config/constants";
import { GameProvider } from "./utils/game-context";
import { init, postEvent } from '@telegram-apps/sdk';

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
const queryClient = new QueryClient();

// init telegram if not in dev mode
try {
  init();
  postEvent('web_app_set_header_color', { color_key: 'bg_color' });
  //postEvent('web_app_request_fullscreen');
  postEvent('web_app_setup_swipe_behavior', { allow_vertical_swipe: false });
} catch (error) {
  console.error("Telegram mini-app init error")
  console.log(error)
}




if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', () => {
    document.body.style.height = window?.visualViewport?.height + 'px';
  });
}
// This will ensure user never overscroll the page
window.addEventListener('scroll', () => {
  if (window.scrollY > 0) window.scrollTo(0, 0);
});


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
