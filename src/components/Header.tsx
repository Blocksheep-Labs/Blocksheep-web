import {
  ConnectWallet,
  Web3Button,
  useBalance,
  useContract,
  useContractWrite,
  useAddress,
  useContractRead,
} from "@thirdweb-dev/react";
import React from "react";
import { BLOCK_SHEEP_CONTRACT, USDC_ADDR } from "../constants";
import { parseUnits } from "ethers/lib/utils";

const btnStyle = "!rounded-xl !bg-black !p-1 !text-white !min-w-8";

function Header() {
  const address = useAddress();
  const { data: balance } = useBalance(USDC_ADDR);
  const { contract: mockUSDC } = useContract(USDC_ADDR);
  const { mutateAsync: mintToken } = useContractWrite(mockUSDC, "mint");

  const { contract: blockSheep } = useContract(BLOCK_SHEEP_CONTRACT);
  const { mutateAsync: deposit } = useContractWrite(blockSheep, "deposit");
  const { mutateAsync: withdraw } = useContractWrite(blockSheep, "withdraw");

  const { data } = useContractRead(blockSheep, "balances", [address]);

  console.log("balance", data);

  return (
    <div className="absolute left-0 top-0 z-10 flex flex-row justify-between">
      <ConnectWallet hideTestnetFaucet={false} />
      <Web3Button
        className={btnStyle}
        contractAddress={USDC_ADDR}
        action={() =>
          mintToken({
            args: [address, parseUnits("100", 6)],
          })
        }
      >
        {balance?.displayValue ?? "0.0"}
      </Web3Button>
      <Web3Button
        className={btnStyle}
        contractAddress={BLOCK_SHEEP_CONTRACT}
        action={() =>
          deposit({
            args: [parseUnits("10", 6)],
          })
        }
      >
        +
      </Web3Button>
      {data && (
        <div className="bg-black rounded-xl p-4 flex items-center text-white">
          <p>{data.toString()}</p>
        </div>
      )}
      <Web3Button
        className={btnStyle}
        contractAddress={BLOCK_SHEEP_CONTRACT}
        action={() =>
          withdraw({
            args: [parseUnits("10", 6)],
          })
        }
      >
        -
      </Web3Button>
    </div>
  );
}

export default Header;
