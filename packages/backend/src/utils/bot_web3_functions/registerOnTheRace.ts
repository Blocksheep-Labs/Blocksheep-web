import {ethers} from "ethers";
import BlocksheepAbi from "../../config/abis/blocksheep.json";
import {getNativeBalance} from "./getnativeBalance";
require('dotenv').config();


const BLOACKSHEEP_ADDRESS = process.env.BLOCKSHEEP_CONTRACT_ADDRESS as string;
const USDC_ADDRESS = process.env.USDC_CONTRACT_ADDRESS as string;


export const registerOnTheRace = async(
    raceId: number,
    signer: ethers.Signer,
) => {
    try {
        const blocksheepContract = new ethers.Contract(
            BLOACKSHEEP_ADDRESS,
            BlocksheepAbi,
            signer
        );

        const usdcContract = new ethers.Contract(
            USDC_ADDRESS,
            BlocksheepAbi,
            signer
        );


        const decimals = await usdcContract.decimals();
        const needToDeposit = 30 * 10 ** Number(decimals);


        const botNativeBalance = ethers.utils.formatEther(await signer.getBalance());
        const botInGameBalance = await blocksheepContract.balances(botNativeBalance);

        let amountToDepositAccordingToUserBalance = needToDeposit - Number(botInGameBalance);

        if (amountToDepositAccordingToUserBalance < 0) {
            amountToDepositAccordingToUserBalance = needToDeposit;
        }


        // mint ETH and USDC
        const txMint = await usdcContract.mint(
            await signer.getAddress(),
            amountToDepositAccordingToUserBalance,
            (!botNativeBalance || Number(botNativeBalance) < 0.0012)
        );
        await txMint.wait();


        // approve USDC spending
        const txApprove = await usdcContract.approve(
            BLOACKSHEEP_ADDRESS,
            amountToDepositAccordingToUserBalance
        );
        await txApprove.wait();


        // deposit USDC
        const txDeposit = await blocksheepContract.deposit(
            amountToDepositAccordingToUserBalance
        );
        await txDeposit.wait();


        // register
        const txRegister = await blocksheepContract.register(raceId);
        await txRegister.wait();

        console.log(`Register tx: ${txRegister}`);
    } catch (err) {
        console.log("Error sending register TX, reason: ", err);
    }
}