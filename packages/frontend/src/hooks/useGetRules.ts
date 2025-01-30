import { ethers } from "ethers";
import { readContract } from "@wagmi/core";
import { config } from "@/config/wagmi";
import { BLOCK_SHEEP_CONTRACT } from "@/config/constants";
import BlockSheepAbi from "@/contracts/BlockSheep.json";



export const useGetRules = (contractName: string,  raceId: number) => {

    const processTransaction = async () => {
        const returnData = await readContract(config, {
            address: BLOCK_SHEEP_CONTRACT,
            abi: BlockSheepAbi,
            functionName: "getRules",
            args: [contractName, raceId],
        });
    
        console.log({ returnData });
    
        if (!returnData) {
            throw new Error("Empty or invalid result received.");
        }
    
        switch (contractName) {
            case "UNDERDOG":
                return ethers.utils.defaultAbiCoder.decode(
                    ["tuple(uint256 id, tuple(string content, string[] answers, string imgUrl) info)[]"],
                    // @ts-ignore
                    returnData
                );
            case "RABBITHOLE":
                return ethers.utils.defaultAbiCoder.decode(
                    ["uint256"], 
                    // @ts-ignore
                    returnData
                );
    
            case "BULLRUN":
                return ethers.utils.defaultAbiCoder.decode(
                    ["int256[3][3]"], 
                    // @ts-ignore
                    returnData
                );
    
            default:
                return null;
        }
    };

    return { getRules: processTransaction };
}
