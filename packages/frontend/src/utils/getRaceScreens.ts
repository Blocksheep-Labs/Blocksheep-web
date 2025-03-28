import { BLOCK_SHEEP_CONTRACT } from "@/config/constants"
import { config } from "@/config/wagmi"
import { readContract } from "@wagmi/core"
import BlockSheepAbi from "@/contracts/BlockSheep.json";

export const getRaceScreens = async(raceId: string, smartAccountAddress: string) => {
    const raceData = await readContract(config, {
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheepAbi,
        functionName: "getRace",
        args: [BigInt(raceId), smartAccountAddress],
    });
    // @ts-ignore
    return raceData.screens || [];
}