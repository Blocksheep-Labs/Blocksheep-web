import { readContract, readContracts } from "@wagmi/core";
import { BLOCK_SHEEP_CONTRACT } from "@/config/constants";
import { config } from "@/config/wagmi";
import BlockSheepAbi from "@/contracts/BlockSheep.json";
import { useSmartAccount } from "./smartAccountProvider";
import { useEffect, useState } from "react";

export type TRace = {
    id: number,
    endAt: number,
    raceDuration: number,
    refunded: boolean,
    registeredUsers: string[],
    numOfPlayersRequired: number,
    status: number,
    registered: boolean,
    screens: string[],
    storyKey: number,
    progress: { user: string, progress: number }[],
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
            }).then(async (data: any) => {    

                const progressData: {user: string, progress: number}[] = [];
        
                const usersProgresses = await readContracts(config, {
                    contracts: (data as TRace).registeredUsers.map((userAddress: string) => ({
                        address: BLOCK_SHEEP_CONTRACT,
                        abi: BlockSheepAbi as any,
                        functionName: "getScoreAtRaceOfUser",
                        args: [
                            BigInt(raceId),
                            userAddress
                        ]
                    }))
                });
        
                usersProgresses.forEach((i: any, index: number) => {
                    progressData.push({ user: (data as TRace).registeredUsers[index], progress: i.result });
                });

                setRace({ ...data, progress: progressData } as TRace);
            });
        }
    }, [raceId, smartAccountAddress]);

    return { race };
}
