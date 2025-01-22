import { BLOCK_SHEEP_CONTRACT, SELECTED_NETWORK, USDC_ADDR } from "../../../config/constants";
import { getUserBalance, retreiveCOST } from "../../../utils/contract-functions";
import { useSmartAccount } from "../../smartAccountProvider";
import { encodeFunctionData } from "viem";
import BlockSheepAbi from "../../../contracts/BlockSheep.json";
import MockUsdcAbi from "../../../contracts/MockUSDC.json";


export const useRegisterOnTheRace = () => {
    const { smartAccountClient, smartAccountAddress } = useSmartAccount();

    const processTransaction = async(raceId: number) => {
        const needToDeposit = Number(await retreiveCOST());
        const userBalance = await getUserBalance(smartAccountAddress as string);

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
