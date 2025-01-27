import { readContract, readContracts } from "@wagmi/core";
import { BLOCK_SHEEP_CONTRACT, SELECTED_NETWORK } from "../../../config/constants";
import { config } from "../../../config/wagmi";
import BlockSheepAbi from "../../../contracts/BlockSheep.json";
import { useSmartAccount } from "../../smartAccountProvider";
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
