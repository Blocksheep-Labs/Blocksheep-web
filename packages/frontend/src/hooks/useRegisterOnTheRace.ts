import { BLOCK_SHEEP_CONTRACT, SELECTED_NETWORK, USDC_ADDR } from "../config/constants";

import { useSmartAccount } from "./smartAccountProvider";
import { encodeFunctionData } from "viem";
import BlockSheepAbi from "../contracts/BlockSheep.json";
import MockUsdcAbi from "../contracts/MockUSDC.json";
import { useUserGameBalance } from "./useUserGameBalance";
import { useRaceEntryCOST } from "./useRaceEntryCost";


export const useRegisterOnTheRace = () => {
    const { smartAccountClient } = useSmartAccount();
    const userBalance = useUserGameBalance();
    const entryCost = useRaceEntryCOST();

    const processTransaction = async(raceId: number) => {
        const needToDeposit = Number(entryCost);

        console.log({userBalance, needToDeposit, isEnough: Number(userBalance) >= needToDeposit});

        if (Number(userBalance) < needToDeposit) {
            const amountToDepositAccordingToUserBalance = needToDeposit - Number(userBalance);
            const approveHash = await smartAccountClient.sendTransaction({
                account: smartAccountClient.account!,
                chain: SELECTED_NETWORK,
                to: USDC_ADDR,
                data: encodeFunctionData({
                    abi: MockUsdcAbi,
                    functionName: "approve",
                    args: [BLOCK_SHEEP_CONTRACT, amountToDepositAccordingToUserBalance]
                }),
            });
            console.log("Aprrove:", approveHash);
            
            const depositHash = await smartAccountClient.sendTransaction({
                account: smartAccountClient.account!,
                chain: SELECTED_NETWORK,
                to: BLOCK_SHEEP_CONTRACT,
                data: encodeFunctionData({
                    abi: BlockSheepAbi,
                    functionName: "deposit",
                    args: [amountToDepositAccordingToUserBalance]
                }),
            });
            console.log("Deposit:", depositHash);
        }
        

        const registerHash = await smartAccountClient.sendTransaction({
            account: smartAccountClient.account!,
            chain: SELECTED_NETWORK,
            to: BLOCK_SHEEP_CONTRACT,
            data: encodeFunctionData({
                abi: BlockSheepAbi,
                functionName: "register",
                args: [BigInt(raceId)]
            }),
        });
    
        console.log("Registered:", registerHash);

        return registerHash;
    }

    return { processTransaction };
}
