import { BLOCK_SHEEP_CONTRACT, USDC_ADDR } from "../config/constants";
import BlockSheep from "../contracts/BlockSheep";
import BlockSheepAbi from "../contracts/BlockSheep.json";
import MockUsdc from "../contracts/MockUSDC";
import { readContract, writeContract, readContracts, getAccount, waitForTransactionReceipt  } from '@wagmi/core';
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
    //usdc.approve(address(blockSheep), amount);
    //blockSheep.deposit(amount);
    const COST = await retreiveCOST();
    console.log(BigInt(Number(COST) * 3));

    // TODO: wait for txs to finish


    const approveUSDC = await writeContract(config, {
        address: USDC_ADDR,
        abi: MockUsdc,
        functionName: 'approve',
        args: [BLOCK_SHEEP_CONTRACT, BigInt(Number(COST) * 3)]
    });
    console.log("APPROVE:", approveUSDC);

    await waitForTransactionReceipt(config, {
        confirmations: 2,
        hash: approveUSDC,
    });

    const depositBlockSheep = await writeContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheepAbi,
        functionName: 'deposit',
        args: [BigInt(Number(COST) * 3)]
    });

    console.log("DEPOSIT:", depositBlockSheep);
    await waitForTransactionReceipt(config, {
        confirmations: 2,
        hash: depositBlockSheep,
    });
    
    const regBlocksheep = await writeContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheepAbi,
        functionName: "register",
        args: [BigInt(raceId)],
    });

    console.log("REGISTER:", regBlocksheep)
    await waitForTransactionReceipt(config, {
        confirmations: 2,
        hash: regBlocksheep,
    });

    
    return regBlocksheep;
}


export const getRacesStatusesByIds = async(ids: number[]) => {
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


export const retreiveCOST = async() => {
    const data = await readContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheep,
        functionName: "COST",
    });
    return data;
}