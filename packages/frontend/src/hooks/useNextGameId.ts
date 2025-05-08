import { config } from "@/config/wagmi";
import { readContract } from "@wagmi/core"
import { BLOCK_SHEEP_CONTRACT } from "@/config/constants";
import BlockSheepAbi from "@/contracts/BlockSheep.json";
import { useEffect, useState } from "react";

export const useNextGameId = () => {
    const [loading, setIsLoading] = useState(true);
    const [rid, setRId] = useState(0);

    useEffect(() => {
        setIsLoading(true);

        const interval = setInterval(() => {
            setIsLoading(true);

            readContract(config, {
                address: BLOCK_SHEEP_CONTRACT,
                abi: BlockSheepAbi,
                functionName: "nextRaceId",
            }).then(id => {
                setRId(Number(id));
                setIsLoading(false);
            }).catch(() => {
                console.log("The next game id can not be read.")
            });
        }, 2000);

        return () => {
            clearInterval(interval);
        }
    }, []);

    return { rid, loading };
}