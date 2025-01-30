import { ethers } from "ethers";

export const GET_POINTS_SELECTOR = ethers.utils.id("getPoints(address, uint256)");
export const GET_POINTS_TYPES = ["address", "uint256"];

export const useGetUserPoints = (
    contractName: string, 
    raceId: number, 
    userAddress: string
) => {


    const processTransaction = async() => {
        const returnData = await readContract(config, {
            address: BLOCK_SHEEP_CONTRACT,
            abi: BlockSheepAbi,
            functionName: "getRules",
            args: [contractName, raceId],
        });

        return ethers.utils.defaultAbiCoder.decode(
            ["int256"],
            result
        );
    }

    return { getPoints: processTransaction };
}
