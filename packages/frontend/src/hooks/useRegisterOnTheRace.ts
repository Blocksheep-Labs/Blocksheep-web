import { BLOCK_SHEEP_CONTRACT, SELECTED_NETWORK, USDC_ADDR } from "@/config/constants";

import { useSmartAccount } from "./smartAccountProvider";
import { encodeFunctionData } from "viem";
import BlockSheepAbi from "@/contracts/BlockSheep.json";
import MockUsdcAbi from "@/contracts/MockUSDC.json";
import { useUserGameBalance } from "./useUserGameBalance";
import { useRaceEntryCOST } from "./useRaceEntryCost";
import { useMintTestETH } from "./useMintTestETH";
import { readContract } from "@wagmi/core";
import { config } from "@/config/wagmi";
import { useBalance } from "wagmi";


export const useRegisterOnTheRace = () => {
    const { smartAccountClient, smartAccountAddress } = useSmartAccount();
    const userBalance = useUserGameBalance();
    const entryCost = useRaceEntryCOST();
    const { processTransaction: mintTestETH } = useMintTestETH();
    const { data: ETHBalance  } = useBalance({
        address: smartAccountAddress
    });

    const processTransaction = async(raceId: number) => {
        const decimals = await readContract(config, {
            address: USDC_ADDR,
            abi: MockUsdcAbi,
            functionName: 'decimals',
        });
    
        const needToDeposit = 30 * 10 ** Number(decimals); // Number(entryCost);
        
        console.log(Number(ETHBalance?.formatted))
        console.log(entryCost, Number(entryCost))
        console.log({userBalance, needToDeposit, isEnough: Number(userBalance) >= needToDeposit});

        await mintTestETH(needToDeposit, Number(ETHBalance?.formatted)).catch(console.log);
        
        //if ((Number(userBalance) < needToDeposit) || (!userBalance && !entryCost)) {
            let amountToDepositAccordingToUserBalance = needToDeposit - Number(userBalance);

            if (amountToDepositAccordingToUserBalance < 0) {
                amountToDepositAccordingToUserBalance = needToDeposit;
            }

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
            
            if (amountToDepositAccordingToUserBalance > 0) {
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
            } else {
                console.log("Skipping deposit, user has enough balance...")
            }
        //}
        

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
