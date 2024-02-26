import { ConnectWallet } from "@thirdweb-dev/react";
import React from "react";

function HomeScreen() {
  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom">
      <ConnectWallet />
    </div>
  );
}

export default HomeScreen;
