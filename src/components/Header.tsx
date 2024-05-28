// import {
//   ConnectWallet,
//   Web3Button,
//   useAddress,
//   useBalance,
//   useContract,
//   useContractWrite,
// } from "@thirdweb-dev/react";
import { parseUnits } from "ethers/lib/utils";
import { USDC_ADDR } from "../constants";
import Sheep from "../assets/gameplay/sheeepy.png";
import { Link } from "react-router-dom";

const btnStyle = "!rounded-xl !bg-black !p-1 !text-white !min-w-8";

function Header() {
  // const address = useAddress();
  // const { data: balance } = useBalance(USDC_ADDR);
  // const { contract: mockUSDC } = useContract(USDC_ADDR);
  // const { mutateAsync: mintToken } = useContractWrite(mockUSDC, "mint");

  return (
    <div className="absolute left-0 top-0 z-10 flex w-full flex-row justify-between">
      <div className="flex gap-2">
        {/* <ConnectWallet hideTestnetFaucet={false} />
        <Web3Button
          className={btnStyle}
          contractAddress={USDC_ADDR}
          action={async () =>
            await mintToken({
              args: [address, parseUnits("100", 6)],
            })
          }
        >
          {balance?.displayValue ?? "0.0"}
        </Web3Button> */}
        <button className="m-2 rounded-xl bg-black p-2 text-white">Connect Wallet</button>
        <button className="m-2 rounded-xl bg-black p-1 text-white">0.0</button>
      </div>
      <Link
        className="flex size-16 items-center justify-center rounded-xl bg-black p-1 text-white"
        to="/account"
      >
        <img src={Sheep} className="h-full" />
      </Link>
    </div>
  );
}

export default Header;
