import { encodeFunctionData } from "viem";
import { BLOCK_SHEEP_CONTRACT, SELECTED_NETWORK, USDC_ADDR } from "../config/constants";
import MockUsdcAbi from "../contracts/MockUSDC.json";
import BlockSheepAbi from "../contracts/BlockSheep.json";
import { useSmartAccount } from "./smartAccountProvider";
import { useUSDCDecimals } from "./useUSDCDecimals";


export const useBuyTokens = () => {
    const { smartAccountAddress, smartAccountClient } = useSmartAccount();
    const decimals = useUSDCDecimals();

    const processTransaction = async(
        amount: number, 
        currentETHBlance: number
    ) => {
        const needToDeposit = amount * 10 * 10**Number(decimals);
        console.log({decimals, needToDeposit, account: smartAccountClient.account, currentETHBlance});

        const mintHash = await smartAccountClient.sendTransaction({
            account: smartAccountClient.account!,
            chain: SELECTED_NETWORK,
            to: USDC_ADDR,
            data: encodeFunctionData({
                abi: MockUsdcAbi,
                functionName: "mint",
                args: [smartAccountAddress, needToDeposit, currentETHBlance < 0.0012]
            }),
        });
        console.log("MINT:", mintHash);
    
        const approveHash = await smartAccountClient.sendTransaction({
            account: smartAccountClient.account!,
            chain: SELECTED_NETWORK,
            to: USDC_ADDR,
            data: encodeFunctionData({
                abi: MockUsdcAbi,
                functionName: "approve",
                args: [BLOCK_SHEEP_CONTRACT, needToDeposit]
            }),
        });
        console.log("APPROVE:", approveHash)
        
        const depositHash = await smartAccountClient.sendTransaction({
            account: smartAccountClient.account!,
            chain: SELECTED_NETWORK,
            to: BLOCK_SHEEP_CONTRACT,
            data: encodeFunctionData({
                abi: BlockSheepAbi,
                functionName: "deposit",
                args: [needToDeposit]
            }),
        });
    
        console.log("DEPOSIT:", depositHash);
        return depositHash;
    }

    return { processTransaction };
}


