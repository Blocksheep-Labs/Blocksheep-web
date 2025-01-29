import { ethers } from "ethers";
import { useWriteRegistredContract } from "./useWriteRegisteredContract";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/config/wagmi";

export const DISTRIBUTE_SELECTOR = ethers.utils.id("distribute(uint256,bytes)").slice(0, 10);
export const DISTRIBUTE_TYPES = ['bytes4', 'uint256', 'bytes'];

export const useDistribute = (contractName: string) => {
    const { processTransaction: write } = useWriteRegistredContract();

    const processTransaction = async(
        data: string,
    ) => {
        const hash = await write(contractName, data);
        await waitForTransactionReceipt(config, {
            hash,
            confirmations: 0,
            pollingInterval: 300,
        });
        return hash;
    }

    return { distribute: processTransaction };
}   
