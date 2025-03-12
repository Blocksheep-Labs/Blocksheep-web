import {ethers} from "ethers";
require('dotenv').config();

const CONTRACT_ADDRESS = process.env.BLOCKSHEEP_CONTRACT_ADDRESS as string;

// ===================================================================
// ======================== ARGUMENT BUILDERS ========================
// ===================================================================

export const buildUnderdog = (currentQuestionIndex: number, answerIndex: 0 | 1, userAddress: string) => {
    return ethers.utils.defaultAbiCoder.encode(
        ["uint8", "uint8", "address"],
        [currentQuestionIndex, answerIndex, userAddress]
    )
}

export const buildRabbithole = (
    fuelSubmission: number,
    fuelLeft: number,
    roundIndex: number,
    userAddress: string,
    leavedUsersAddresses: string[]
) => {
    return ethers.utils.defaultAbiCoder.encode(
        ["uint256", "uint256", "uint256", "address", "address[]"],
        [fuelSubmission, fuelLeft, roundIndex, userAddress, leavedUsersAddresses]
    )
}

export const buildBullrun = (perkIndex: number, opponentAddress: string, userAddress: string) => {
    return ethers.utils.defaultAbiCoder.encode(
        ["uint256", "address", "address"],
        [perkIndex, opponentAddress, userAddress]
    )
}

// ===================================================================
// ========================= CALLER FUNCTION =========================
// ===================================================================

export const makeMove = async(
    contractName: string,
    raceId: number,
    botAddress: string,
    signer: ethers.Signer,
) => {

    const getSendingParams = (contractName: string) => {
        switch (contractName) {
            case "UNDERDOG":
                return buildUnderdog(
                    0, // TODO: change question index
                    Math.random() < 0.5 ? 0 : 1,
                    botAddress,
                );
            case "RABBITHOLE":
                return buildRabbithole(
                    0, // TODO: change bot fuel submission count
                    0, // TODO: change bot fuel left
                    0, // TODO: change round index
                    botAddress,
                    [] // TODO: change the users left array
                );
            case "BULLRUN":
                return buildBullrun(
                    Math.floor(Math.random() * 3), // perk index 0, 1 or 2
                    "", // TODO: change the opponent address
                    botAddress,
                );
            default:
                return;
        }
    }

    try {
        const contract = new ethers.Contract(
            CONTRACT_ADDRESS, // TODO: pass contract address
            "", // TODO: pass contract ABI
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
        console.log("Error sending makeMove TX, reason: ", err);
    }
}