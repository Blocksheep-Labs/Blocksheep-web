import { ethers } from "ethers";
import { config } from "@/config/wagmi";
import { BLOCK_SHEEP_CONTRACT } from "@/config/constants";
import BlockSheepAbi from "@/contracts/BlockSheep.json";
import { readContract } from "@wagmi/core"


export const GET_USER_CHOICES_SELECTOR = ethers.utils.id("getUserChoices(uint256,address)");
export const GET_USER_CHOICES_TYPES = ["uint256", "address"];

export const useGetUserChoices = (
    contractName: string, 
    raceId: number, 
    userAddress: string
) => {
    const processTransaction = async() => {
        const returnData = await readContract(config, {
            address: BLOCK_SHEEP_CONTRACT,
            abi: BlockSheepAbi,
            functionName: "getUserChoices",
            args: [contractName, raceId, userAddress],
        });

        return returnData;
    }

    return { getUserChoices: processTransaction };
}
