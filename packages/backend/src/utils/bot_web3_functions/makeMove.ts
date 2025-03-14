import {ethers} from "ethers";
import envCfg from "../../config/env";
import BlocksheepAbi from "../../config/abis/blocksheep.json";
import Web3 from "web3";
require('dotenv').config();


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
    underdogData?: {
        questionIndex: number;
    },
    rabbitholeData?: {
        fuelSubmission: number,
        fuelLeft: number,
        roundIndex: number,
        leavedUsersAddresses: string[]
    },
    bullrunData?: {
        opponentAddress: string,
    }
) => {

    const getSendingParams = (contractName: string) => {
        switch (contractName) {
            case "UNDERDOG":
                return buildUnderdog(
                    underdogData?.questionIndex as number,
                    Math.random() < 0.5 ? 0 : 1,
                    botAddress,
                );
            case "RABBITHOLE":
                return buildRabbithole(
                    rabbitholeData?.fuelSubmission as number,
                    rabbitholeData?.fuelLeft as number,
                    rabbitholeData?.roundIndex as number,
                    botAddress,
                    rabbitholeData?.leavedUsersAddresses as string[]
                );
            case "BULLRUN":
                return buildBullrun(
                    Math.floor(Math.random() * 3), // perk index 0, 1 or 2
                    bullrunData?.opponentAddress as string,
                    botAddress,
                );
            default:
                return;
        }
    }

    const botAddrIndex = envCfg.BOTS_ADDRS.indexOf(botAddress);
    if (botAddrIndex === -1) {
        throw new Error(`Bot address ${botAddress} not found in BOTS_ADDRS.`);
    }

    try {
        const web3 = new Web3(new Web3.providers.HttpProvider(envCfg.RPC_URL));
        const account = web3.eth.accounts.privateKeyToAccount(envCfg.BOTS_PRIVATE_KEYS[botAddrIndex]);

        if (!web3.eth.accounts.wallet.get(account.address)) {
            web3.eth.accounts.wallet.add(account);
        }

        const blocksheepContract = new web3.eth.Contract(
            BlocksheepAbi,
            envCfg.BLOCKSHEEP_CONTRACT_ADDRESS
        );


        const txMakeMove = await blocksheepContract.methods.makeMove(
            contractName,
            raceId,
            getSendingParams(contractName)
        ).send({ from: account.address });

        return txMakeMove.transactionHash;
    } catch (err) {
        console.log("Error sending makeMove TX, reason: ", err);
    }
}