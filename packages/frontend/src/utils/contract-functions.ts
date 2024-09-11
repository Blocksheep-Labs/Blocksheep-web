import { BLOCK_SHEEP_CONTRACT, SELECTED_NETWORK, USDC_ADDR } from "../config/constants";
import BlockSheepAbi from "../contracts/BlockSheep.json";
import MockUsdcAbi from "../contracts/MockUSDC.json";
import { readContract, readContracts } from '@wagmi/core';
import { config } from "../config/wagmi";
import { encodeFunctionData } from "viem";
import { title } from "process";

const SELECTED_CHAIN = SELECTED_NETWORK;

const BLOCK_SHEEP_BASE_CONFIG = {
    address: BLOCK_SHEEP_CONTRACT,
    abi: BlockSheepAbi,
};

// used for fetching last game "id"
export const getNextGameId = async() => {
    const data = await readContract(config, {
        ...BLOCK_SHEEP_BASE_CONFIG,
        functionName: "nextRaceId",
    });
    return data;
}

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

// fetching the list itself
export const getRacesWithPagination = async(userAddr: `0x${string}`, from: number) => {
    const nextGameId = await getNextGameId();

    if (Number(nextGameId) < from || Number(nextGameId) === 0) {
        return [];
    }

    let data = await readContract(config, {
        ...BLOCK_SHEEP_BASE_CONFIG,
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

    //console.log(data)

    // @ts-ignore
    data = data.filter(r => {
        // if not refunced
        if (!r.refunded) {
            // user was regiistered into the race
            if (r.registered && ([1,2,3,4].includes(Number(r.status)))) {
                return true;
            }

            if (!r.registered && r.status === 3) {
                return true;
            }

            return false;
        }
        // refunded 
        else {
            // expired
            if (r.status === 1) {
                return false;
            }
            if (r.registered) {
                return true;
            }
            return false;
        }
    });

    //@ts-ignore
    //data.reverse();

    return data;
}

// get race by id
export const getRaceById = async(raceId: number, userAddr: `0x${string}`) => {
    const data = await readContract(config, {
        ...BLOCK_SHEEP_BASE_CONFIG,
        functionName: "getRaces",
        args: [BigInt(raceId), userAddr]
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

// enter the race
export const registerOnTheRace = async(raceId: number, numberOfQuestions: number, smartAccountClient: any, smartAccountAddress: any) => {
    const COST = await retreiveCOST();
    const decimals = await getTokenDecimals();
   
    
    const userBalance = await getUserBalance(smartAccountAddress);

    const needToDeposit = numberOfQuestions * Number(COST);

    console.log({userBalance, needToDeposit, isEnough: Number(userBalance) >= needToDeposit});

    
    if (Number(userBalance) < needToDeposit) {
        const amountToDepositAccordingToUserBalance = needToDeposit - Number(userBalance);
        const approveHash = await smartAccountClient.sendTransaction({
            account: smartAccountClient.account!,
            chain: SELECTED_CHAIN,
            to: USDC_ADDR,
            data: encodeFunctionData({
                abi: MockUsdcAbi,
                functionName: "approve",
                args: [BLOCK_SHEEP_CONTRACT, amountToDepositAccordingToUserBalance]
            }),
        });
        console.log("APPROVE:", approveHash)
        
        const depositHash = await smartAccountClient.sendTransaction({
            account: smartAccountClient.account!,
            chain: SELECTED_CHAIN,
            to: BLOCK_SHEEP_CONTRACT,
            data: encodeFunctionData({
                abi: BlockSheepAbi,
                functionName: "deposit",
                args: [amountToDepositAccordingToUserBalance]
            }),
        });
    
        console.log("DEPOSIT:", depositHash);
    }
    
        
    
    const registerHash = await smartAccountClient.sendTransaction({
        account: smartAccountClient.account!,
        chain: SELECTED_CHAIN,
        to: BLOCK_SHEEP_CONTRACT,
        data: encodeFunctionData({
            abi: BlockSheepAbi,
            functionName: "register",
            args: [BigInt(raceId)]
        }),
    });

    console.log("REGISTER:", registerHash)

    return registerHash;
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


export const buyTokens = async(amount: number, smartAccountClient: any) => {
    const decimals = await getTokenDecimals();
    const needToDeposit = amount * 10 * 10**Number(decimals);

    console.log({decimals, needToDeposit, account: smartAccountClient.account})

    const approveHash = await smartAccountClient.sendTransaction({
        account: smartAccountClient.account!,
        chain: SELECTED_CHAIN,
        to: USDC_ADDR,
        data: encodeFunctionData({
            abi: MockUsdcAbi,
            functionName: "approve",
            args: [BLOCK_SHEEP_CONTRACT, needToDeposit]
        }),
    });
    console.log("APPROVE:", approveHash)
    
    const depositHash = await smartAccountClient.sendTransaction({
        account: smartAccountClient.account!,
        chain: SELECTED_CHAIN,
        to: BLOCK_SHEEP_CONTRACT,
        data: encodeFunctionData({
            abi: BlockSheepAbi,
            functionName: "deposit",
            args: [needToDeposit]
        }),
    });

    console.log("DEPOSIT:", depositHash);
    return depositHash;
} 

export const withdrawTokens = async(amount: number, smartAccountClient: any) => {
    const withdrawHash = await smartAccountClient.sendTransaction({
        account: smartAccountClient.account!,
        chain: SELECTED_CHAIN,
        to: BLOCK_SHEEP_CONTRACT,
        data: encodeFunctionData({
            abi: BlockSheepAbi,
            functionName: "withdraw",
            args: [amount]
        }),
    });

    console.log("WITHDRAW:", withdrawHash);
    return withdrawHash;
} 

export const adminCreateRace = async(
    title: string,
    hoursBeforeFinish: number,
    playersRequired: number,
    smartAccountClient: any
) => {
    const creationHash = await smartAccountClient.sendTransaction({
        account: smartAccountClient.account!,
        chain: SELECTED_CHAIN,
        to: BLOCK_SHEEP_CONTRACT,
        data: encodeFunctionData({
            abi: BlockSheepAbi,
            functionName: "addRace",
            args: [title, hoursBeforeFinish, playersRequired, [{gameId: 0, questionIds: [0, 1, 2]}]]
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