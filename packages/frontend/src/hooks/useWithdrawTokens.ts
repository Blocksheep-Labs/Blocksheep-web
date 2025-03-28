import { encodeFunctionData } from "viem";
import { BLOCK_SHEEP_CONTRACT, SELECTED_NETWORK } from "@/config/constants";
import BlockSheepAbi from "@/contracts/BlockSheep.json";
import { useSmartAccount } from "./smartAccountProvider";


export const useWithdrawTokens = () => {
    const { smartAccountClient } = useSmartAccount();
    
    const processTransaction = async(amount: number) => {
        const withdrawHash = await smartAccountClient.sendTransaction({
            account: smartAccountClient.account!,
            chain: SELECTED_NETWORK,
            to: BLOCK_SHEEP_CONTRACT,
            data: encodeFunctionData({
                abi: BlockSheepAbi,
                functionName: "withdraw",
                args: [amount]
            }),
        });
    
        console.log("WITHDRAW:", withdrawHash);
        return withdrawHash;
    }

    return { processTransaction };
}
