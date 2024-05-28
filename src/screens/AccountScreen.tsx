// import {
//   Web3Button,
//   useAddress,
//   useContract,
//   useContractRead,
//   useContractWrite,
// } from "@thirdweb-dev/react";
// import { formatUnits, parseUnits } from "ethers/lib/utils";
// import { BLOCK_SHEEP_CONTRACT, USDC_ADDR } from "../constants";
// import ApproveERC20 from "../components/ApproveERC20";
// import BlockSheepABI from "../contracts/BlockSheep";

const btnStyle = "!rounded-xl !p-1 !min-w-8 flex-1";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { selectCount, selectStatus } from "../features/counter/counterSlice";

function AccountScreen() {
  // const address = useAddress();
  // const { contract: blockSheep } = useContract(BLOCK_SHEEP_CONTRACT);
  // const { mutateAsync: deposit } = useContractWrite(blockSheep, "deposit");
  // const { mutateAsync: withdraw } = useContractWrite(blockSheep, "withdraw");

  // const { data } = useContractRead(blockSheep, "balances", [address]);

  //added code
  //  const dispatch = useAppDispatch();
  const count = useAppSelector(selectCount);
  const status = useAppSelector(selectStatus);
  //  const status = useAppSelector(selectStatus);
  //  const [incrementAmount, setIncrementAmount] = useState("2");

  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom">
      <div className="mt-24 flex">
        {/* {data && ( */}
        {
          <div className="m-auto flex w-[85%] gap-2">
            <div className="flex items-center rounded-xl bg-black p-4 text-white">
              {/* <p>{formatUnits(data, 6).toString()}</p> */}
              <p>Wallet Balance: 0</p>
              <p>Count: {count}</p>
              <p>Status: {status}</p>
            </div>
            <div className="flex w-full flex-col gap-2">
              {/* <ApproveERC20
                token={USDC_ADDR}
                amount={BigInt(parseUnits("10", 6).toString())}
                contract={BLOCK_SHEEP_CONTRACT}
              >
                <Web3Button
                  className={btnStyle}
                  contractAddress={BLOCK_SHEEP_CONTRACT}
                  contractAbi={BlockSheepABI}
                  action={async () =>
                    await deposit({
                      args: [parseUnits("10", 6)],
                    })
                  }
                  onSuccess={() => alert("Success")}
                  onError={(error) => alert(error)}
                >
                  Deposit
                </Web3Button>
              </ApproveERC20>

              <Web3Button
                className={btnStyle}
                contractAddress={BLOCK_SHEEP_CONTRACT}
                contractAbi={BlockSheepABI}
                action={async () =>
                  await withdraw({
                    args: [parseUnits("10", 6)],
                  })
                }
                onSuccess={() => alert("Success")}
                onError={(error) => alert(error)}
              >
                Withdraw
              </Web3Button> */}
              <button className={btnStyle}>Deposit</button>
              {/* <ApproveERC20
                token={USDC_ADDR}
                amount={BigInt(parseUnits("10", 6).toString())}
                contract={BLOCK_SHEEP_CONTRACT}
              >
                <Web3Button
                  className={btnStyle}
                  contractAddress={BLOCK_SHEEP_CONTRACT}
                  contractAbi={BlockSheepABI}
                  action={async () =>
                    await deposit({
                      args: [parseUnits("10", 6)],
                    })
                  }
                  onSuccess={() => alert("Success")}
                  onError={(error) => alert(error)}
                >
                  Deposit
                </Web3Button>
              </ApproveERC20> */}

              <button
                className={btnStyle}
                // contractAddress={BLOCK_SHEEP_CONTRACT}
                // contractAbi={BlockSheepABI}
                // action={async () =>
                //   await withdraw({
                //     args: [parseUnits("10", 6)],
                //   })
                // }
                // onSuccess={() => alert("Success")}
                // onError={(error) => alert(error)}
              >
                Withdraw
              </button>
            </div>
          </div>
        }
      </div>
    </div>
  );
}

export default AccountScreen;
