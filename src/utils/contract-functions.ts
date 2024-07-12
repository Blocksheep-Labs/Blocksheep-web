import { BLOCK_SHEEP_CONTRACT } from "../config/constants";
import BlockSheep from "../contracts/BlockSheep";
import { readContract, writeContract, readContracts, getAccount } from '@wagmi/core';
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

    let data = await readContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheep,
        functionName: "getRacesWithPagination",
        args: [userAddr, BigInt(from), nextGameId]
    });


    const ids = Array.from(Array(Number(nextGameId)).keys()).map(i => i + from);
    const racesStatuses = await getRacesStatusesByIds(ids);

    data = data.map((i, k) => {
        // @ts-ignore 
        i.id = ids[k];
        i.status = Number(racesStatuses[k]);
        return i;
    });

    return data;
}

// enter the race
export const registerOnTheRace = async(raceId: number, walletAddress: `0x${string}`) => {
    const data = await writeContract(config, {
        account: walletAddress,
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheep,
        functionName: "register",
        args: [BigInt(raceId)],
    });

    return data;
}


export const getRacesStatusesByIds = async(ids: number[]) => {
    const contracts = ids.map(raceId => {
        return {
            address: BLOCK_SHEEP_CONTRACT,
            abi: BlockSheep,
            functionName: "getRaceStatus",
            args: [BigInt(raceId)]
        }
    });
    
    const data = await readContracts(config, {
        contracts: ids.map(raceId => {
            return {
                address: BLOCK_SHEEP_CONTRACT,
                abi: BlockSheep,
                functionName: "getRaceStatus",
                args: [BigInt(raceId)]
            }
        })
    });

    return data.map(i => i.result);
} 