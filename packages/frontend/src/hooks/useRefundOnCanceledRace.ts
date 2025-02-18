import { BLOCK_SHEEP_CONTRACT, SELECTED_NETWORK } from "../config/constants";
import { useSmartAccount } from "./smartAccountProvider";
import { encodeFunctionData } from "viem";
import BlockSheepAbi from "../contracts/BlockSheep.json";
import { config } from "../config/wagmi";
import { waitForTransactionReceipt } from "@wagmi/core";

export const useRefundOnCanceledRace = () => {
    const { smartAccountClient } = useSmartAccount();

    const processTransaction = async(amount: number, raceId: number) => {
        const refundBalanceHash = await smartAccountClient.sendTransaction({
            account: smartAccountClient.account!,
            chain: SELECTED_NETWORK,
            to: BLOCK_SHEEP_CONTRACT,
            data: encodeFunctionData({
                abi: BlockSheepAbi,
                functionName: "refundBalance",
                args: [BigInt(amount), BigInt(raceId)]
            }),
        });

        await waitForTransactionReceipt(config, {
            hash: refundBalanceHash,
            confirmations: 0,
            pollingInterval: 300,
        });
    
        return refundBalanceHash;
    }

    return { refundOnCanceledRace: processTransaction };
}