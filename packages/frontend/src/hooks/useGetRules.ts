import { ethers } from "ethers";
import { useReadRegisteredContract } from "./useReadRegisteredContract";

export const GET_RULES_SELECTOR = ethers.utils.id("getRules(uint256)");
export const GET_RULES_TYPES = ["uint256"];

 

export const useGetRules = (contractName: string, raceId: number) => {
    const { processTransaction: read } = useReadRegisteredContract();

    const processTransaction = async() => {
        const result = await read(
            contractName, 
            ethers.utils.defaultAbiCoder.encode(
                GET_RULES_TYPES,
                [raceId]
            )
        );

        switch (contractName) {
            case "UNDERDOG":
                return ethers.utils.defaultAbiCoder.decode(
                    ["tuple(uint256 id, tuple(string content, string[] answers, string imgUrl) info)[]"],
                    result
                );
            
            case "RABBITHOLE":
                return ethers.utils.defaultAbiCoder.decode(
                    ["uint256"],
                    result
                );

            case "BULLRUN":
                return ethers.utils.defaultAbiCoder.decode(
                    ["int256[3][3]"],
                    result
                );

            default:
                return null;
        }
    }

    return { getRules: processTransaction };
}
