import { BLOCK_SHEEP_CONTRACT } from "../config/constants";
import BlockSheep from "../contracts/BlockSheep";
import { readContract, writeContract } from '@wagmi/core';
import { config } from "../config/wagmi";

// used for fetching last game "id"
export const getNextGameId = async() => {
    const data = await readContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheep,
        functionName: "nextRaceId",
    });
    return data;
}

// fetching the list itself
export const getRacesWithPagination = async(userAddr: `0x${string}`, from: number) => {
    const nextGameId = await getNextGameId();

    if (Number(nextGameId) < from || Number(nextGameId) === 0) {
        return [];
    }

    const data = await readContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheep,
        functionName: "getRacesWithPagination",
        args: [userAddr, BigInt(from), nextGameId]
    });

    return data;
}

// enter the race
export const registerOnTheRace = async(raceId: number) => {
    const data = await writeContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheep,
        functionName: "register",
        args: [BigInt(raceId)]
    });
    
    return data;
}