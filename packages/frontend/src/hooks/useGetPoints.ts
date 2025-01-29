import { ethers } from "ethers";
import { useReadRegisteredContract } from "./useReadRegisteredContract";

export const GET_POINTS_SELECTOR = ethers.utils.id("getPoints(address, uint256)");
export const GET_POINTS_TYPES = ["address", "uint256"];

export const useGetUserPoints = (
    contractName: string, 
    raceId: number, 
    userAddress: string
) => {
    const { processTransaction: read } = useReadRegisteredContract();

    const processTransaction = async() => {
        const result = await read(
            contractName, 
            ethers.utils.defaultAbiCoder.encode(
                GET_POINTS_TYPES,
                [userAddress, raceId]
            )
        );

        return ethers.utils.defaultAbiCoder.decode(
            ["int256"],
            result
        );
    }

    return { getPoints: processTransaction };
}
