import {ethers} from "ethers";
import BlocksheepAbi from "../../config/abis/blocksheep.json";
import envCfg from "../../config/env";
import Web3 from "web3";
import {handleUpdateProgress} from "../../socket/events";
import {getIO} from "../../socket/init";
import {socket} from "frontend/src/utils/socketio";

require('dotenv').config();



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
    rabbitholeData?: {
        version: string,
    },
    bullrunData?: {
        opponentAddress: string,
    }
) => {

    const getSendingParams = (contractName: string) => {
        switch (contractName) {
            case "UNDERDOG":
                return buildUnderdog();
            case "RABBITHOLE":
                return buildRabbithole(botAddress);
            case "BULLRUN":
                return buildBullrun(
                    bullrunData?.opponentAddress as string,
                    botAddress,
                );
            default:
                return;
        }
    }

    // PRE-SUBMIT EVENTS
    switch (contractName) {
        case "UNDERDOG":
            break;
        case "RABBITHOLE":
            break;
        case "BULLRUN":
            break;
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

        const currentNonce = await web3.eth.getTransactionCount(account.address, 'pending');
        const txDistribute = await blocksheepContract.methods.distribute(
            contractName,
            raceId,
            getSendingParams(contractName)
        ).send({
            from: account.address,
            nonce: currentNonce.toString(), // Correct nonce
            gas: "3000000", // Set adequate gas limit
            gasPrice: String(await web3.eth.getGasPrice()) // Fetch latest gas price
        });

        // AFTER-SUBMIT EVENTS
        switch (contractName) {
            case "UNDERDOG":
                await handleUpdateProgress({
                    raceId,
                    userAddress: botAddress,
                    property: "underdog-distribute",
                    value: {
                        completed: null,
                        of: null,
                        isDistributed: true,
                    }
                }, getIO());
                break;
            case "RABBITHOLE":
                await handleUpdateProgress({
                    raceId,
                    userAddress: botAddress,
                    property: "rabbithole-wait-to-finish",
                    version: rabbitholeData?.version
                });
                break;
            case "BULLRUN":
                break;
        }

        return txDistribute.transactionHash;
    } catch (err) {
        console.log("Error sending distribute TX, reason: ", err);
    }
}