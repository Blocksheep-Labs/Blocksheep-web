import { ethers } from "ethers";
import { config } from "@/config/wagmi";
import { BLOCK_SHEEP_CONTRACT } from "@/config/constants";
import BlockSheepAbi from "@/contracts/BlockSheep.json";
import { readContract } from "@wagmi/core"

export const GET_POINTS_SELECTOR = ethers.utils.id("getPoints(address, uint256)");
export const GET_POINTS_TYPES = ["address", "uint256"];

export const useGetUserPoints = (
    contractName: string, 
    raceId: number, 
    userAddress: string
) => {
    const processTransaction = async() => {
        const returnData = await readContract(config, {
            address: BLOCK_SHEEP_CONTRACT,
            abi: BlockSheepAbi,
            functionName: "getPoints",
            args: [contractName, userAddress, raceId],
        });

        return returnData;
    }

    return { getPoints: processTransaction };
}
