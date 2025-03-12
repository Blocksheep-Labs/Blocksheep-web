import {ethers} from "ethers";
import BlocksheepAbi from "../../config/abis/blocksheep.json";

require('dotenv').config();

const CONTRACT_ADDRESS = process.env.BLOCKSHEEP_CONTRACT_ADDRESS as string;


// ===================================================================
// ======================== ARGUMENT BUILDERS ========================
// ===================================================================

export const buildUnderdog = () => {
    return "0x";
}

export const buildRabbithole = (userAddress: string) => {
    return ethers.utils.defaultAbiCoder.encode(
        ["address"],
        [userAddress]
    );
}

export const buildBullrun = (opponentAddress: string, userAddress: string) => {
    return ethers.utils.defaultAbiCoder.encode(
        ["address", "address"],
        [opponentAddress, userAddress]
    );
}

// ===================================================================
// ========================= CALLER FUNCTION =========================
// ===================================================================

export const distribute = async(
    contractName: string,
    raceId: number,
    botAddress: string,
    signer: ethers.Signer,
) => {

    const getSendingParams = (contractName: string) => {
        switch (contractName) {
            case "UNDERDOG":
                return buildUnderdog();
            case "RABBITHOLE":
                return buildRabbithole(botAddress);
            case "BULLRUN":
                return buildBullrun(
                    "", // TODO: pass current bot opponent
                    botAddress,
                );
            default:
                return;
        }
    }

    try {
        const contract = new ethers.Contract(
            CONTRACT_ADDRESS,
            BlocksheepAbi,
            signer,
        );

        const tx = await contract.makeMove(
            contractName,
            raceId,
            getSendingParams(contractName),
        );

        const receipt = await tx.wait(1);
        return receipt.transactionHash;
    } catch (err) {
        console.log("Error sending distribute TX, reason: ", err);
    }
}