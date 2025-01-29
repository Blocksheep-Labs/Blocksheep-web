import { BLOCK_SHEEP_CONTRACT } from "@/config/constants";
import { useSmartAccount } from "./smartAccountProvider"
import BlockSheepAbi from "@/contracts/BlockSheep.json";

export const useReadRegisteredContract = () => {
    const { smartAccountClient} = useSmartAccount();

    const processTransaction = async(
        contractName: string,
        encodedData: string, // bytes memory
    ) => {
        const returnData = await smartAccountClient.readContract({
            address: BLOCK_SHEEP_CONTRACT,
            abi: BlockSheepAbi,
            functionName: "callFunctionAtRegisteredContract",
            args: [contractName, encodedData],
        });
        console.log("Return Data:", returnData);

        return returnData;
    }

    return { processTransaction }
}