import { useReadContract } from "wagmi"
import { BLOCK_SHEEP_CONTRACT } from "../config/constants"
import blocksheepAbi from "../contracts/BlockSheep.json"
import { useSmartAccount } from "./smartAccountProvider"

export const useUserGameBalance = () => {
    const { smartAccountAddress } = useSmartAccount();

    const {data: balance} = useReadContract({
        address: BLOCK_SHEEP_CONTRACT,
        abi: blocksheepAbi,
        functionName: 'balances',
        args: [smartAccountAddress]
    });

    return balance;
}