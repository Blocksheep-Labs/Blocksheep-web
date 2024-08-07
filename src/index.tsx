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
import { config } from "./config/wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from '@privy-io/wagmi';


const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
const queryClient = new QueryClient()

root.render(
    <Provider store={store}>
        <PrivyProvider 
          appId="clyh534er03w5wdid94l1grap"
          config={{
            loginMethods: ['wallet'],
            appearance: {
              theme: 'light'
            }
          }}
        >
          <QueryClientProvider client={queryClient}>
            <WagmiProvider config={config}>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </WagmiProvider>
          </QueryClientProvider>
        </PrivyProvider>
    </Provider>
);

Modal.setAppElement("#root");

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();
