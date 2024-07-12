
import { parseUnits } from "ethers/lib/utils";
import Sheep from "../assets/gameplay/sheeepy.png";
import { Link } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import shortenAddress from "../utils/shortenAddress";
import { useEffect } from "react";
import { useUserBalance } from "../hooks/useUserBalance";

const btnStyle = "!rounded-xl !bg-black !p-1 !text-white !min-w-8";

function Header() {
  // const address = useAddress();
  //const { data: balance, status, isLoading, isError } = useBalance(USDC_ADDR);
  //const { contract: mockUSDC } = useContract(USDC_ADDR);
  // const { mutateAsync: mintToken } = useContractWrite(mockUSDC, "mint");
  const {login, logout, user} = usePrivy();
  const userBalance = useUserBalance(user?.wallet?.address as `0x${string}`);

  const handleLoginLogout = () => {
    if (user?.wallet?.address) {
      logout();
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
          { user?.wallet?.address ? shortenAddress(user.wallet.address) : "Connect wallet" }
        </button>
        <button className="m-2 rounded-xl bg-black p-1 text-white">{userBalance ? Number(userBalance) : "0.00"}</button>
      </div>
      <Link
        className="flex m-2 size-12 items-center justify-center rounded-xl bg-black p-1 text-white"
        to="/account"
      >
        <img src={Sheep} className="h-full" />
      </Link>
    </div>
  );
}

export default Header;
