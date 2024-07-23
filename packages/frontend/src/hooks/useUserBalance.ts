import { useReadContract } from "wagmi"
import { USDC_ADDR } from "../config/constants"
import MockUSDC from "../contracts/MockUSDC.json"

export const useUserBalance = (userAddr: `0x${string}`) => {
    const {data: balance} = useReadContract({
        address: USDC_ADDR,
        abi: MockUSDC,
        functionName: 'balanceOf',
        args: [userAddr]
    });

    return balance;
}