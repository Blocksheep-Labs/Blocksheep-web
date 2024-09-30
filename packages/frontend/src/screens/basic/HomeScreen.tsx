// import { ConnectWallet, useAddress } from "@thirdweb-dev/react";
// import React, { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import BlockSheepLogo from "../../assets/home/black sheepy.png";
import Sheep from "../../assets/home/sheep itself.png";
import SheepShadow from "../../assets/home/sheep shadow.png";
import FlagYellow from "../../assets/home/Layer 8.png";
import FlagGreen from "../../assets/home/Layer 12.png";
import { useEffect } from "react";
import { useLinkWithSiwe, useLogin, usePrivy } from "@privy-io/react-auth";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import { SELECTED_NETWORK } from "../../config/constants";
import { useNavigate } from "react-router-dom";


function HomeScreen() {
  const navigate = useNavigate();
  const { smartAccountAddress, smartAccountClient } = useSmartAccount();
  const { generateSiweMessage, linkWithSiwe } = useLinkWithSiwe();
  const { login } = useLogin({
    onComplete: async(user) => {
      console.log("LOGGED IN AS:", user);
    }
  });
  const { logout } = usePrivy();

  useEffect(() => {
    const linkAccount = async() => {
      console.log(smartAccountAddress, smartAccountClient)
      if (!smartAccountClient || !smartAccountAddress) return;
    
      const chainId = `eip155:${SELECTED_NETWORK.id}`;
      const message = await generateSiweMessage({
        address: smartAccountAddress,
        chainId
      });
      const signature = await smartAccountClient.signMessage({message});

      try {
        await linkWithSiwe({
          signature,
          message,
          chainId,
          //walletClientType: 'privy_smart_account',
          connectorType: 'safe'
        });
      } catch (error) {
        
      } finally {
        navigate('/select');
      }
    }

    linkAccount();
  }, [smartAccountClient, smartAccountAddress]);




  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom relative">
      <div className="flex items-center justify-center h-52">
        <img src={BlockSheepLogo} alt="blocksheep" className="w-60"/>
      </div>
      <div className="flex items-center justify-center h-96 absolute bottom-0 left-3">
        <div className="relative">
          <div className="flex flex-col relative">
            <img src={Sheep} alt="blocksheep" className="w-36 z-10"/>
            <img src={SheepShadow} alt="blocksheep" className="w-36 absolute bottom-[-40px]"/>
          </div>
          <img src={FlagYellow} alt="start" className="absolute left-[88%] scale-150 bottom-10 z-10"/>
          <img src={FlagGreen} alt="start" className="absolute left-[105%] scale-110 bottom-28"/>
          <button 
            onClick={login}
            className="w-full z-10 rotate-2 absolute left-[100%] bottom-[175px] text-center font-[Berlin-Bold] text-[35px] text-[#18243F] hover:text-white disabled:text-gray-500 disabled:hover:text-gray-500 disabled:mt-5">
            Play
          </button>
          <button 
            className="w-full z-10 rotate-2 absolute left-[100%] bottom-[120px] text-center font-[Berlin-Bold] text-[18px] disabled:text-[20px] text-[#18243F] hover:text-white">
            How to play
          </button>
        </div>
      </div>
      <button className="absolute bottom-3 right-3 font-bold text-3xl text-white" onClick={logout}>X</button>
    </div>
  );
}

export default HomeScreen;
