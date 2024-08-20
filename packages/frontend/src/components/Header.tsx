// import { parseUnits } from "ethers/lib/utils";
import Sheep from "../assets/gameplay/sheeepy.png";
import { Link, useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import shortenAddress from "../utils/shortenAddress";
import { useUserBalance } from "../hooks/useUserBalance";
import { USDC_MULTIPLIER } from "../config/constants";
import { useSmartAccount } from "../hooks/smartAccountProvider";


function Header() {
  const { smartAccountAddress } = useSmartAccount();
  const { logout } = usePrivy();
  const navigate = useNavigate();
  
  const userBalance = useUserBalance(smartAccountAddress as `0x${string}`);

  const handleLogout = () => {
    if (smartAccountAddress) {
      logout().then(_ => {
        navigate('/');
      });
    }
  }

  return (
    <div className="absolute left-0 top-0 z-10 flex w-full flex-row justify-between">
      <div className="flex gap-2">
        <button 
          className="m-2 rounded-xl bg-black p-2 text-white" 
          onClick={handleLogout}
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
