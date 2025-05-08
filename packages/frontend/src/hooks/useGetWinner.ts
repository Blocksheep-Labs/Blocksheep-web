import { ethers } from "ethers";
import { config } from "@/config/wagmi";
import { BLOCK_SHEEP_CONTRACT } from "@/config/constants";
import BlockSheepAbi from "@/contracts/BlockSheep.json";
import { readContract } from "@wagmi/core"

export const GET_WINNER_SELECTOR = ethers.utils.id("getWinner(uint256)");
export const GET_WINNER_TYPES = ["uint256"];

export const useGetWinner = (
    contractName: string, raceId: number
) => {
    const processTransaction = async() => {
        const returnData = await readContract(config, {
            address: BLOCK_SHEEP_CONTRACT,
            abi: BlockSheepAbi,
            functionName: "getWinner",
            args: [contractName, raceId],
        });

        return returnData;
    }

    return { getWinner: processTransaction };
}

