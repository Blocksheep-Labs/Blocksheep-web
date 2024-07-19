import { BLOCK_SHEEP_CONTRACT, USDC_ADDR } from "../config/constants";
import BlockSheepAbi from "../contracts/BlockSheep.json";
import MockUsdcAbi from "../contracts/MockUSDC.json";
import { readContract, writeContract, readContracts, getAccount, waitForTransactionReceipt  } from '@wagmi/core';
import { config } from "../config/wagmi";

// used for fetching last game "id"
export const getNextGameId = async() => {
    const data = await readContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheepAbi,
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
        abi: BlockSheepAbi,
        functionName: "getRacesWithPagination",
        args: [userAddr, BigInt(from), nextGameId]
    });

    const ids = Array.from(Array(Number(nextGameId)).keys()).map(i => i + from);
    const racesStatuses = await getRacesStatusesByIds(ids);

    // @ts-ignore 
    data = data.map((i, k) => {
        i.id = ids[k];
        i.status = Number(racesStatuses[k]);
        return i;
    });

    return data;
}

// get race by id
export const getRaceById = async(raceId: number) => {
    const data = await readContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheepAbi,
        functionName: "getRaces",
        args: [BigInt(raceId)]
    });

    
    const questionsData = await readContracts(config, {
        // @ts-ignore
        contracts: data[5].map(gameId => {
            return {
                address: BLOCK_SHEEP_CONTRACT,
                abi: BlockSheepAbi,
                functionName: "getQuestions",
                args: [BigInt(raceId), BigInt(gameId)]
            }
        }) 
    });

    return {
        race: data,
        //@ts-ignore
        questionsByGames: questionsData.map(i => i.result)
    };
}

// enter the race
export const registerOnTheRace = async(raceId: number, walletAddress: `0x${string}`) => {
    const COST = await retreiveCOST();
    console.log(BigInt(Number(COST) * 3));

    const approveUSDC = await writeContract(config, {
        address: USDC_ADDR,
        abi: MockUsdcAbi,
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

// fetches races status by ids
export const getRacesStatusesByIds = async(ids: number[]) => {
    const data = await readContracts(config, {
        // @ts-ignore
        contracts: ids.map(raceId => {
            return {
                address: BLOCK_SHEEP_CONTRACT,
                abi: BlockSheepAbi,
                functionName: "getRaceStatus",
                args: [BigInt(raceId)]
            }
        })
    });

    return data.map(i => i.result);
} 

// COST per 1 question in game
export const retreiveCOST = async() => {
    const data = await readContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheepAbi,
        functionName: "COST",
    });
    return data;
}


// fetch questions by raceID
export const getRaceQuestionsByGameId = async(raceId: number, gameId: number) => {
    const data = await readContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheepAbi,
        functionName: "getQuestions",
        args: [BigInt(raceId), BigInt(gameId)]
    });
    return data;
}

// fetch gamesNames by ids
export const getGamesNamesByIds = async(ids: number[]) => {
    const data = await readContracts(config, {
        // @ts-ignore
        contracts: ids.map(id => {
            return {
                address: BLOCK_SHEEP_CONTRACT,
                abi: BlockSheepAbi,
                functionName: "getGameNames",
                args: [BigInt(id)]
            }
        })
    });
    return data.map(i => i.result);
} 


// save user answer
export const submitUserAnswer = async(
    raceId: number,
    gameIndex: number,
    questionIndex: number,
    answerId: number,
) => {
    console.log(raceId, gameIndex, questionIndex, answerId)
    const data = await writeContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheepAbi,
        functionName: "submitAnswer",
        args: [
            BigInt(raceId), 
            BigInt(gameIndex), 
            BigInt(questionIndex), 
            BigInt(answerId)
        ]
    });

    return data;
}


// distribute reward of the 1 game
export const distributeRewardOfTheGame = async(
    raceId: number,
    gameIndex: number,
    questionIndex: number,
) => {
    const data = await writeContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheepAbi,
        functionName: "distributeReward",
        args: [
            BigInt(raceId),
            BigInt(gameIndex),
            BigInt(questionIndex),
        ]
    });

    return data;
}


// withdraw funds
export const refundBalance = async(amount: number) => {
    const data = await writeContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheepAbi,
        functionName: "refundBalance",
        args: [BigInt(amount)]
    });

    return data;
}


// fetch results
export const getScoreAtGameOfUser = async(
    raceId: number,
    gameIndex: number,
    userAddress: `0x${string}`
) => {
    const data = await readContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheepAbi,
        functionName: "getScoreAtGameOfUser",
        args: [
            BigInt(raceId),
            BigInt(gameIndex),
            userAddress
        ]
    });

    return data;
}