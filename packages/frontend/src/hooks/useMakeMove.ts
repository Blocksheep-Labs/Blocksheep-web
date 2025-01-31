import { ethers } from "ethers";

import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/config/wagmi";
import { BLOCK_SHEEP_CONTRACT } from "@/config/constants";
import { encodeFunctionData } from "viem";
import { useSmartAccount } from "./smartAccountProvider";
import { SELECTED_NETWORK } from "@/config/constants";
import BlockSheepAbi from "@/contracts/BlockSheep.json";

export const MAKE_MOVE_SELECTOR = ethers.utils.id("makeMove(uint256,bytes)").slice(0, 10); // First 4 bytes
export const MAKE_MOVE_TYPES = ['bytes4', 'uint256', 'bytes'];

export const useMakeMove = (contractName: string, raceId: number) => {
    const { smartAccountClient } = useSmartAccount();

    const processTransaction = async(
        data: string,
    ) => {
        console.log({contractName, raceId, data})
        const hash = await smartAccountClient.sendTransaction({
            account: smartAccountClient.account!,
            chain: SELECTED_NETWORK,
            to: BLOCK_SHEEP_CONTRACT,
            data: encodeFunctionData({
                abi: BlockSheepAbi,
                functionName: "makeMove",
                args: [
                    contractName, raceId, data
                ]
            }),
        });

        await waitForTransactionReceipt(config, {
            hash,
            confirmations: 0,
            pollingInterval: 300,
        });
        
        return hash;
    }

    return { makeMove: processTransaction };
}
