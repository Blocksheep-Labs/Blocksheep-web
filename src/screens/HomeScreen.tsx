// import { ConnectWallet, useAddress } from "@thirdweb-dev/react";
// import React, { useEffect } from "react";
import React from "react";
// import { useNavigate } from "react-router-dom";
function HomeScreen() {
  // const address = useAddress();
  // const navigate = useNavigate();
  // useEffect(() => {
  //   if (address) {
  //     navigate("/select");
  //   }
  // }, [address]);

  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom">
      {/* <ConnectWallet /> */}
      <button>Connect Wallet</button>
    </div>
  );
}

export default HomeScreen;
