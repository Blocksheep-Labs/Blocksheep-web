import { useReadContract } from "wagmi"
import { BLOCK_SHEEP_CONTRACT } from "../config/constants"
import blocksheepAbi from "../contracts/BlockSheep.json"

export const useRaceEntryCOST = () => {
    const {data: cost} = useReadContract({
        address: BLOCK_SHEEP_CONTRACT,
        abi: blocksheepAbi,
        functionName: 'COST'
    });

    return cost;
}