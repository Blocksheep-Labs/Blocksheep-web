import { encodeFunctionData } from "viem";
import { BLOCK_SHEEP_CONTRACT, SELECTED_NETWORK } from "../config/constants";
import BlockSheepAbi from "../contracts/BlockSheep.json";
import { useSmartAccount } from "./smartAccountProvider";
import { ethers } from "ethers";

export type TUnderdogQuestion = {
    imgUrl: string,
    content: string,
    answers: string[],
}

export const useAdminCreateRace = () => {
    const {smartAccountClient} = useSmartAccount();

    const processTransaction = async(
        hoursBeforeFinish: number,
        playersRequired: number,
        storyKey: number,
        initStateForUnderdog: TUnderdogQuestion[],
        initStateForBullrun: number[][],
        screensOrder: string[],
    ) => {
        const encodedPerksMatrix = ethers.utils.defaultAbiCoder.encode(
            ["int256[3][3]"],
            [initStateForBullrun]
        );

        const encodedQuestions = ethers.utils.defaultAbiCoder.encode(
            ["tuple(string content, string[] answers, string imgUrl)[]"],
            [initStateForUnderdog.map(q => [q.content, q.answers, q.imgUrl])]
        );

        const creationHash = await smartAccountClient.sendTransaction({
            account: smartAccountClient.account!,
            chain: SELECTED_NETWORK,
            to: BLOCK_SHEEP_CONTRACT,
            data: encodeFunctionData({
                abi: BlockSheepAbi,
                functionName: "addRace",
                args: [
                    hoursBeforeFinish, 
                    playersRequired, 
                    storyKey,
                    screensOrder,
                    encodedPerksMatrix, // initStateFor Bullrun
                    encodedQuestions,   // initStateFor Underdog
                ]
            }),
        });
    
        console.log("Race created:", creationHash);
        return creationHash;
    }

    return { processTransaction };
}