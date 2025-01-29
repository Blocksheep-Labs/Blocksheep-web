import { BLOCK_SHEEP_CONTRACT, SELECTED_NETWORK } from "@/config/constants";
import { useSmartAccount } from "./smartAccountProvider"
import { encodeFunctionData } from "viem";
import BlockSheepAbi from "@/contracts/BlockSheep.json";


export const useWriteRegistredContract = () => {
    const { smartAccountClient } = useSmartAccount();

    const processTransaction = async(
        contractName: string,
        encodedData: string, // bytes memory
    ) => {
        const executionHash = await smartAccountClient.sendTransaction({
            account: smartAccountClient.account!,
            chain: SELECTED_NETWORK,
            to: BLOCK_SHEEP_CONTRACT,
            data: encodeFunctionData({
                abi: BlockSheepAbi,
                functionName: "callFunctionAtRegisteredContract",
                args: [
                    contractName,
                    encodedData,
                ]
            }),
        });

        console.log("Execution hash:", executionHash);
        return executionHash;
    }

    return { processTransaction };
}
