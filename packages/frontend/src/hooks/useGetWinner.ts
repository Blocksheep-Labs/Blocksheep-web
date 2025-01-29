import { ethers } from "ethers";
import { useReadRegisteredContract } from "./useReadRegisteredContract";

export const GET_WINNER_SELECTOR = ethers.utils.id("getWinner(uint256)");
export const GET_WINNER_TYPES = ["uint256"];

export const useGetWinner = (contractName: string, raceId: number) => {
    const { processTransaction: read } = useReadRegisteredContract();

    const processTransaction = async() => {
        const result = await read(
            contractName, 
            ethers.utils.defaultAbiCoder.encode(
                GET_WINNER_TYPES,
                [raceId]
            )
        );

        return ethers.utils.defaultAbiCoder.decode(
            ["address[], address[]"],
            result
        );
    }

    return { getWinner: processTransaction };
}
