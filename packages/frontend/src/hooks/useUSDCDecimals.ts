import { useReadContract } from "wagmi"
import { USDC_ADDR } from "../config/constants"
import MockUSDC from "../contracts/MockUSDC.json"

export const useUSDCDecimals = () => {
    const {data: decimals} = useReadContract({
        address: USDC_ADDR,
        abi: MockUSDC,
        functionName: 'balanceOf',
    });

    return decimals;
}