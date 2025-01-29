import { ethers } from "ethers";
import { useReadRegisteredContract } from "./useReadRegisteredContract";

export const GET_USER_CHOICES_SELECTOR = ethers.utils.id("getUserChoices(uint256,address)");
export const GET_USER_CHOICES_TYPES = ["uint256", "address"];

export const useGetUserChoices = (
    contractName: string, 
    raceId: number, 
    userAddress: string
) => {
    const { processTransaction: read } = useReadRegisteredContract();

    const processTransaction = async() => {
        const result = await read(
            contractName, 
            ethers.utils.defaultAbiCoder.encode(
                GET_USER_CHOICES_TYPES,
                [raceId, userAddress]
            )
        );

        return ethers.utils.defaultAbiCoder.decode(
            ["uint256[]"],
            result
        );
    }

    return { getUserChoices: processTransaction };
}
