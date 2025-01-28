import { BLOCK_SHEEP_CONTRACT, SELECTED_NETWORK, USDC_ADDR } from "../config/constants";
import BlockSheepAbi from "../contracts/BlockSheep.json";
import MockUsdcAbi from "../contracts/MockUSDC.json";
import { readContract, readContracts } from '@wagmi/core';
import { config } from "../config/wagmi";
import { encodeFunctionData } from "viem";

const SELECTED_CHAIN = SELECTED_NETWORK;

const BLOCK_SHEEP_BASE_CONFIG = {
    address: BLOCK_SHEEP_CONTRACT,
    abi: BlockSheepAbi,
};


export const getTokenDecimals = async() => {
    const data = await readContract(config, {
        address: USDC_ADDR,
        abi: MockUsdcAbi,
        functionName: "decimals",
    });

    return data;
}

export const getUserBalance = async(userAddr: string) => {
    const data = await readContract(config, {
        ...BLOCK_SHEEP_BASE_CONFIG,
        functionName: 'balances',
        args: [userAddr]
    });

    return data;
}


// fetches races status by ids
export const getRacesStatusesByIds = async(ids: number[]) => {
    const data = await readContracts(config, {
        // @ts-ignore
        contracts: ids.map(raceId => {
            return {
                ...BLOCK_SHEEP_BASE_CONFIG,
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
        ...BLOCK_SHEEP_BASE_CONFIG,
        functionName: "COST",
    });
    return data;
}


// fetch questions by raceID
export const getRaceQuestionsByGameId = async(raceId: number, gameId: number) => {
    const data = await readContract(config, {
        ...BLOCK_SHEEP_BASE_CONFIG,
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
                ...BLOCK_SHEEP_BASE_CONFIG,
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
    smartAccountClient: any
) => {
    console.log(raceId, gameIndex, questionIndex, answerId)

    const submitAnswerHash = await smartAccountClient.sendTransaction({
        account: smartAccountClient.account!,
        chain: SELECTED_CHAIN,
        to: BLOCK_SHEEP_CONTRACT,
        data: encodeFunctionData({
            abi: BlockSheepAbi,
            functionName: "submitAnswer",
            args: [
                BigInt(raceId), 
                BigInt(gameIndex), 
                BigInt(questionIndex), 
                BigInt(answerId)
            ]
        }),
    });

    return submitAnswerHash;
}


// distribute reward of the 1 game
export const distributeRewardOfTheGame = async(
    raceId: number,
    gameIndex: number,
    questionIndexes: number[],
    smartAccountClient: any,
    isDraw: boolean,
    smartAccountAddress: any
) => {
    const distributeRewardHash = await smartAccountClient.sendTransaction({
        account: smartAccountClient.account!,
        chain: SELECTED_CHAIN,
        to: BLOCK_SHEEP_CONTRACT,
        data: encodeFunctionData({
            abi: BlockSheepAbi,
            functionName: "distributeReward",
            args: [
                BigInt(raceId),
                BigInt(gameIndex),
                questionIndexes.map(i => BigInt(i)),
                isDraw,
                smartAccountAddress
            ]
        }),
    });

    return distributeRewardHash;
}


// withdraw funds
export const refundBalance = async(amount: number, raceId: number, smartAccountClient: any) => {
    const refundBalanceHash = await smartAccountClient.sendTransaction({
        account: smartAccountClient.account!,
        chain: SELECTED_CHAIN,
        to: BLOCK_SHEEP_CONTRACT,
        data: encodeFunctionData({
            abi: BlockSheepAbi,
            functionName: "refundBalance",
            args: [BigInt(amount), BigInt(raceId)]
        }),
    });

    return refundBalanceHash;
}


// fetch results
export const getScoreAtGameOfUser = async(
    raceId: number,
    gameIndex: number,
    userAddress: `0x${string}`,
    gameName: string
) => {
    const data = await readContract(config, {
        ...BLOCK_SHEEP_BASE_CONFIG,
        functionName: "getScoreAtGameOfUser",
        args: [
            BigInt(raceId),
            BigInt(gameIndex),
            userAddress,
            gameName
        ]
    });

    return data;
}


export const submitFuel = async(
    raceId: number,
    fuelSubmision: number,
    fuelLeft: number,
    smartAccountClient: any,
) => {
    const submitFuelHash = await smartAccountClient.sendTransaction({
        account: smartAccountClient.account!,
        chain: SELECTED_CHAIN,
        to: BLOCK_SHEEP_CONTRACT,
        data: encodeFunctionData({
            abi: BlockSheepAbi,
            functionName: "submitFuel",
            args: [raceId, fuelSubmision, fuelLeft]
        }),
    });

    return submitFuelHash;
}


export const finishTunnelGame = async(
    raceId: number,
    isWon: boolean,
    smartAccountClient: any,
    points: number
) => {
    const finishTunnelGameHash = await smartAccountClient.sendTransaction({
        account: smartAccountClient.account!,
        chain: SELECTED_CHAIN,
        to: BLOCK_SHEEP_CONTRACT,
        data: encodeFunctionData({
            abi: BlockSheepAbi,
            functionName: "finishTunnelGame",
            args: [raceId, isWon, points]
        }),
    });

    return finishTunnelGameHash;
}


export const getScoreAtRaceOfUser = async(
    raceId: number,
    user: string,
) => {
    const data = await readContract(config, {
        ...BLOCK_SHEEP_BASE_CONFIG,
        functionName: "getScoreAtRaceOfUser",
        args: [raceId, user]
    });

    return data;
}



export const getTestETH = async(amount: number, smartAccountClient: any, smartAccountAddress: any, currentETHBlance: number) => {
    const decimals = await getTokenDecimals();
    const needToDeposit = amount * 10 * 10**Number(decimals);

    console.log(currentETHBlance, 0.0012, currentETHBlance < 0.0012)
    if (!currentETHBlance || currentETHBlance < 0.0012) {
        console.log('getting test ETH...');
        const mintHash = await smartAccountClient.sendTransaction({
            account: smartAccountClient.account!,
            chain: SELECTED_CHAIN,
            to: USDC_ADDR,
            data: encodeFunctionData({
                abi: MockUsdcAbi,
                functionName: "mint",
                args: [smartAccountAddress, needToDeposit, (!currentETHBlance || currentETHBlance < 0.0012)]
            }),
        });
        console.log("MINT:", mintHash);
    }
}



export const adminCreateRace = async(
    title: string,
    hoursBeforeFinish: number,
    playersRequired: number,
    smartAccountClient: any,
    questionIds: number[],
) => {
    const creationHash = await smartAccountClient.sendTransaction({
        account: smartAccountClient.account!,
        chain: SELECTED_CHAIN,
        to: BLOCK_SHEEP_CONTRACT,
        data: encodeFunctionData({
            abi: BlockSheepAbi,
            functionName: "addRace",
            args: [
                title, 
                hoursBeforeFinish, 
                playersRequired, 
                [{gameId: 0, questionIds}], 
                [[-1, -2, 3], [1, 0, 0], [-1, 1, 1]]]
        }),
    });

    console.log("CREATED:", creationHash);
    return creationHash;
}

export const userHasAdminAccess = async(smartAccountClient: any) => {
    const userIsAdmin = await readContract(config, {
        ...BLOCK_SHEEP_BASE_CONFIG,
        functionName: "userHasAdminAccess",
        args: [smartAccountClient.account.address]
    });

    return userIsAdmin;
}



export const BULLRUN_makeChoice = async(
    smartAccountClient: any, 
    raceId: number, 
    perkIndex: number, 
    opponentAddress: string
) => {
    const setPointsHash = await smartAccountClient.sendTransaction({
        account: smartAccountClient.account!,
        chain: SELECTED_CHAIN,
        to: BLOCK_SHEEP_CONTRACT,
        data: encodeFunctionData({
            abi: BlockSheepAbi,
            functionName: "BULLRUN_makeChoice",
            args: [raceId, perkIndex, opponentAddress]  
        }),
    });

    return setPointsHash;
}

export const BULLRUN_getPerksMatrix = async(raceId: number) => {
    const perksMatrix = await readContract(config, {
        ...BLOCK_SHEEP_BASE_CONFIG,
        functionName: "BULLRUN_getPerksMatrix",
        args: [raceId]
    });

    return perksMatrix;
}

export const BULLRUN_distribute = async(
    smartAccountClient: any,
    raceId: number,
    opponentAddress: string,
) => {
    const distributeHash = await smartAccountClient.sendTransaction({
        account: smartAccountClient.account!,
        chain: SELECTED_CHAIN,
        to: BLOCK_SHEEP_CONTRACT,
        data: encodeFunctionData({
            abi: BlockSheepAbi,
            functionName: "BULLRUN_distribute",
            args: [raceId, opponentAddress]  
        }),
    });

    return distributeHash; 
}


export const BULLRUN_getAmountOfPointsPerGame = async(
    userAddress: string, raceId: number
) => {
    const points = await readContract(config, {
        ...BLOCK_SHEEP_BASE_CONFIG,
        functionName: "BULLRUN_getAmountOfPointsPerGame",
        args: [userAddress, raceId]
    });

    return points;
};

export const BULLRUN_getUserChoicesIndexes = async(
    userAddress: string, raceId: number
) => {
    const points = await readContract(config, {
        ...BLOCK_SHEEP_BASE_CONFIG,
        functionName: "BULLRUN_getUserChoicesIndexes",
        args: [raceId, userAddress]
    });

    return points;
};


export const BULLRUN_getWinnersPerGame = async(raceId: number) => {
    const winners = await readContract(config, {
        ...BLOCK_SHEEP_BASE_CONFIG,
        functionName: "BULLRUN_getWinnersPerGame",
        args: [raceId]
    });

    return {
        // @ts-ignore
        firstPlaceUser: winners[0],
        // @ts-ignore
        secondPlaceUser: winners[1],
        // @ts-ignore
        thirdPlaceUser: winners[2],
    };
}



// get race by id
export const getRaceById = async(raceId: number, userAddr: `0x${string}`) => {
    const data = await readContract(config, {
        ...BLOCK_SHEEP_BASE_CONFIG,
        functionName: "getRaces",
        args: [BigInt(raceId), userAddr],
    });

    // @ts-ignore
    const gamesIds = data[4];

    
    const questionsData = await readContracts(config, {
        // @ts-ignore
        contracts: gamesIds.map(gameId => {
            return {
                ...BLOCK_SHEEP_BASE_CONFIG,
                functionName: "getQuestions",
                args: [BigInt(raceId), BigInt(gameId)]
            }
        }) 
    });

    // @ts-ignore
    const usersRegistered = data[8];
    const progressData: {user: string, progress: number}[] = [];

    await Promise.all(gamesIds.map(async (_: any, gameIndex: number) => {
        const usersProgresses = await readContracts(config, {
            contracts: usersRegistered.map((userAddress: string) => ({
                ...BLOCK_SHEEP_BASE_CONFIG,
                functionName: "getScoreAtRaceOfUser",
                args: [
                    BigInt(raceId),
                    userAddress
                ]
            }))
        });

        usersProgresses.forEach((i: any, index: number) => {
            progressData.push({ user: usersRegistered[index], progress: i.result });
        });
    }));

    console.log("RACE DATA", data)

    return {
        race: data,
        //@ts-ignore
        numberOfGames: data[2],
        //@ts-ignore
        questionsByGames: questionsData.map(i => i.result),
        //@ts-ignore
        gamesCompletedPerUser: data[5],
        //@ts-ignore
        registeredUsers: data[8],
        //@ts-ignore
        progress: progressData,
        //@ts-ignore
        numberOfPlayersRequired: data[10],
    };
}