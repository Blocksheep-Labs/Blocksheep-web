import { DISTRIBUTE_SELECTOR, DISTRIBUTE_TYPES } from "@/hooks/useDistribute";
import { ethers } from "ethers";


export const build = (raceId: number) => {
    return ethers.utils.solidityPack(
        DISTRIBUTE_TYPES,
        [
            DISTRIBUTE_SELECTOR, 
            Number(raceId), 
            ""
        ]
    )
}