import { readContract, readContracts } from "@wagmi/core";
import { config } from "../config/wagmi";
import { BLOCK_SHEEP_CONTRACT } from "../config/constants";
import BlockSheepAbi from "../contracts/BlockSheep.json";
import { useSmartAccount } from "./smartAccountProvider";
import { useEffect, useState } from "react";
import { TRace } from "./useRaceById";
import { useNextGameId } from "./useNextGameId";


export const useRacesWithPagination = (from: number) => {
    const { smartAccountAddress } = useSmartAccount();
    const [ races, setRaces ] = useState<undefined | TRace[]>(undefined);
    const { rid: nextGameId } = useNextGameId();

    const getRacesStatusesByIds = async(ids: number[]) => {
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

    const fetchRaces = async() => {
        if (Number(nextGameId) < from || Number(nextGameId) === 0) {
            return [];
        }

        let data = await readContract(config, {
            address: BLOCK_SHEEP_CONTRACT,
            abi: BlockSheepAbi,
            functionName: "getRacesWithPagination",
            args: [smartAccountAddress, BigInt(from), nextGameId]
        });
        
        const ids = Array.from(Array(Number(nextGameId)).keys()).map(i => i + from);
        const racesStatuses = await getRacesStatusesByIds(ids);

        // @ts-ignore 
        data = data.map((i, k) => {
            i.id = ids[k];
            i.status = Number(racesStatuses[k]);
            return i;
        });

        // console.log({data})

        // @ts-ignore
        data = data.filter(r => {

            // if not refunced
            if (!r.refunded) {
                // user not registered and it is 2/2 or 9/9 players in game
                if (!r.registered && r.registeredUsers.length == r.numOfPlayersRequired) {
                    return false;
                }

                // user was regiistered into the race
                if (r.registered && ([1,2,3,4].includes(Number(r.status)))) {
                    //console.log(r)
                    return true;
                }

                if (!r.registered && [2,3].includes(r.status)) {
                    //console.log(r)
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
                    //console.log(r)
                    return true;
                }
                return false;
            }
        });

        // console.log({data});

        // @ts-ignore
        setRaces(data);
    }

    useEffect(() => {
        if (smartAccountAddress) {
            const iId = setInterval(() => {
                fetchRaces();
            }, 2000);

            return () => {
                clearInterval(iId);
            }
        }
    }, [smartAccountAddress, nextGameId]);


    return { races };
}