// import { parseUnits } from "ethers/lib/utils";
import Sheep from "../assets/gameplay/sheeepy.png";
import { Link } from "react-router-dom";
import { useLinkWithSiwe, useLogin, usePrivy } from "@privy-io/react-auth";
import shortenAddress from "../utils/shortenAddress";
import { useUserBalance } from "../hooks/useUserBalance";
import { SELECTED_NETWORK, USDC_MULTIPLIER } from "../config/constants";
import { useSmartAccount } from "../hooks/smartAccountProvider";
import { useEffect } from "react";


function Header() {
  const { smartAccountAddress, smartAccountClient } = useSmartAccount();
  const { generateSiweMessage, linkWithSiwe } = useLinkWithSiwe();
  const { logout } = usePrivy();
  const { login } = useLogin({
    onComplete: async(user) => {
      console.log("LOGGED IN AS:", user);
    }
  });

  useEffect(() => {
    const linkAccount = async() => {
      if (!smartAccountClient || !smartAccountAddress) return;
    
      const chainId = `eip155:${SELECTED_NETWORK.id}`;
      const message = await generateSiweMessage({
        address: smartAccountAddress,
        chainId
      });
      const signature = await smartAccountClient.signMessage({message});

      await linkWithSiwe({
        signature,
        message,
        chainId,
        walletClientType: 'privy_smart_account',
        connectorType: 'safe'
      });
    }

    linkAccount()
  }, [smartAccountClient, smartAccountAddress])
  
  const userBalance = useUserBalance(smartAccountAddress as `0x${string}`);

  const handleLoginLogout = () => {
    if (smartAccountAddress) {
      logout().then(_ => {
        window.location.reload();
      });
    } else {
      login();
    }
  }

  return (
    <div className="absolute left-0 top-0 z-10 flex w-full flex-row justify-between">
      <div className="flex gap-2">
        <button 
          className="m-2 rounded-xl bg-black p-2 text-white" 
          onClick={handleLoginLogout}
        >
          { smartAccountAddress ? shortenAddress(smartAccountAddress) : "Connect with privy" }
        </button>

        <button className="m-2 rounded-xl bg-black p-2 text-white">{userBalance ? `${
          (() => {
            let money = (Number(userBalance) / USDC_MULTIPLIER).toString();
            money = money.slice(0, money.indexOf('.')) + money.slice(money.indexOf('.'), money.length - 3);
            return money;
          })()
        }$` : "0.00$"}</button>
      </div>
      <Link
        className="flex m-2 size-12 items-center justify-center rounded-xl bg-black p-1 text-white"
        to="/account"
      >
        <img src={Sheep} className="h-full"/>
      </Link>
    </div>
  );
}

export default Header;
