import { useSmartAccount } from "./smartAccountProvider"
import MockUSDCAbi from "../contracts/MockUSDC.json";
import { SELECTED_NETWORK, USDC_ADDR } from "@/config/constants";
import { encodeFunctionData } from "viem";
import { config } from "@/config/wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";


export const useMintTestETH = () => {
    const { smartAccountClient, smartAccountAddress } = useSmartAccount();

    const processTransaction = async(
        USDCamount: number,
        currentETHBlance: number
    ) => {
        console.log(currentETHBlance, 0.0012, currentETHBlance < 0.0012)
        
        console.log('getting test ETH if needed and USDC tokens...');
        const mintHash = await smartAccountClient.sendTransaction({
            account: smartAccountClient.account!,
            chain: SELECTED_NETWORK,
            to: USDC_ADDR,
            data: encodeFunctionData({
                abi: MockUSDCAbi,
                functionName: "mint",
                args: [smartAccountAddress, USDCamount, (!currentETHBlance || currentETHBlance < 0.0012)]
            }),
        });

        await waitForTransactionReceipt(config, {
            hash: mintHash,
            confirmations: 0,
            pollingInterval: 300,
        });
        
        console.log("MINT:", mintHash);
        return mintHash;
        
    }

    return { processTransaction };
}