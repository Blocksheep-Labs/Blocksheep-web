import { useReadContract } from "wagmi"
import { BLOCK_SHEEP_CONTRACT, USDC_ADDR } from "../config/constants"
import MockUSDC from "../contracts/MockUSDC.json"
import BlockSheepAbi from "../contracts/BlockSheep.json"

export const useUserBalance = (userAddr: `0x${string}`) => {
    const {data: balance} = useReadContract({
        address: BLOCK_SHEEP_CONTRACT,
        abi: BlockSheepAbi,
        functionName: 'balances',
        args: [userAddr]
    });

    return balance;
}