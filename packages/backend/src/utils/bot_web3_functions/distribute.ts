import {ethers} from "ethers";
import BlocksheepAbi from "../../config/abis/blocksheep.json";
import envCfg from "../../config/env";
import Web3 from "web3";

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

        const txDistribute = await blocksheepContract.methods.distribute(
            contractName,
            raceId,
            getSendingParams(contractName)
        ).send({ from: account.address });

        return txDistribute.transactionHash;
    } catch (err) {
        console.log("Error sending distribute TX, reason: ", err);
    }
}