import { ethers } from "ethers";
import { useWriteRegistredContract } from "./useWriteRegisteredContract";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "@/config/wagmi";

export const MAKE_MOVE_SELECTOR = ethers.utils.id("makeMove(uint256,bytes)").slice(0, 10); // First 4 bytes
export const MAKE_MOVE_TYPES = ['bytes4', 'uint256', 'bytes'];

export const useMakeMove = (contractName: string) => {
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

    return { makeMove: processTransaction };
}
