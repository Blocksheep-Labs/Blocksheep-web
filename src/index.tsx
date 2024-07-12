import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import Modal from "react-modal";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { PrivyProvider } from "@privy-io/react-auth";
import { WagmiProvider } from "wagmi";
import { config } from "./config/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";


const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
const queryClient = new QueryClient()

root.render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <WagmiProvider config={config}>
          <PrivyProvider 
            appId="clyh534er03w5wdid94l1grap"
            config={{
              loginMethods: ['wallet'],
              appearance: {
                theme: 'light'
              }
            }}
          >
            <BrowserRouter>
              <App />
            </BrowserRouter>
          </PrivyProvider>
        </WagmiProvider>
      </QueryClientProvider>
    </Provider>
);

Modal.setAppElement("#root");

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();
