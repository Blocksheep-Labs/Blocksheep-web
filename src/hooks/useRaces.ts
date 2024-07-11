import { useReadContract } from "wagmi"
import { BLOCK_SHEEP_CONTRACT } from "../config/constants";
import BlockSheep from "../contracts/BlockSheep";

// used for fetching last game "id"
export const useNextGameId = () => {
    const {data: id} = useReadContract({
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheep,
        functionName: "nextRaceId",
    });
    return id;
}

// fethcing the list itself
export const useRacesWithPagination = (userAddr: `0x${string}`, from: number, to: bigint) => {
    const { data: races } = useReadContract({
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheep,
        functionName: "getRacesWithPagination",
        args: [userAddr, BigInt(from), to]
    });

    return races;
}