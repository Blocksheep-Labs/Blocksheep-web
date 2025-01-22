import { readContract, readContracts } from "@wagmi/core";
import { BLOCK_SHEEP_CONTRACT, SELECTED_NETWORK } from "../../../config/constants";
import { config } from "../../../config/wagmi";
import BlockSheepAbi from "../../../contracts/BlockSheep.json";
import { useSmartAccount } from "../../smartAccountProvider";
import { useEffect, useState } from "react";

export type TRace = {
    id: number,
    startAt: number,
    raceDuration: number,
    refunded: boolean,
    registeredUsers: string[],
    numOfPlayersRequired: number,
    status: number,
    registered: boolean,
}

export const useRaceById = (raceId: number | null) => {
    const { smartAccountAddress } = useSmartAccount();
    const [race, setRace] = useState<undefined | TRace>(undefined);

    // console.log({ smartAccountAddress, raceId })

    useEffect(() => {
        if (raceId !== null && smartAccountAddress) {
            readContract(config, {
                address: BLOCK_SHEEP_CONTRACT,
                abi: BlockSheepAbi,
                functionName: "getRace",
                args: [BigInt(raceId), smartAccountAddress],
            }).then((data: any) => {    
                setRace(data as TRace);
            });
        }
    }, [raceId, smartAccountAddress]);

    return { race };
}

// get race by id
const getRaceById = async(raceId: number, userAddr: `0x${string}`) => {
    const data = await readContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheepAbi,
        functionName: "getRaces",
        args: [BigInt(raceId), userAddr],
    });

    // @ts-ignore
    const gamesIds = data[4];

    
    const questionsData = await readContracts(config, {
        // @ts-ignore
        contracts: gamesIds.map(gameId => {
            return {
                chain: SELECTED_NETWORK,
                to: BLOCK_SHEEP_CONTRACT,
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
                address: BLOCK_SHEEP_CONTRACT,
                abi: BlockSheepAbi,
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