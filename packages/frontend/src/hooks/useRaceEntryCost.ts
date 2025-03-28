import { readContract } from "@wagmi/core"
import { BLOCK_SHEEP_CONTRACT } from "../config/constants"
import blocksheepAbi from "../contracts/BlockSheep.json"
import { config } from "@/config/wagmi";
import { useEffect, useState } from "react";


export const useRaceEntryCOST = () => {
    const [cost, setCost] = useState(0);

    useEffect(() => {
        readContract(config, {
            address: BLOCK_SHEEP_CONTRACT,
            abi: blocksheepAbi,
            functionName: "COST",
        }).then(b => {
            console.log(b);
            setCost(Number(b));
        });
    }, []);

    return cost;
}