import {ethers} from "ethers";
import envCfg from "../../config/env";
import BlocksheepAbi from "../../config/abis/blocksheep.json";
import Web3 from "web3";
import {handleUpdateProgress} from "../../socket/events";
import {getIO} from "../../socket/init";
import {bullrunSetPending} from "../../socket/events-by-games/bullrun";
import ConnectedUserSchema from "../../models/games-socket/default/connected-user.mongo";
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
type TContractName = "UNDERDOG" | "RABBITHOLE" | "BULLRUN";

export const makeMove = async(
    contractName: TContractName,
    raceId: number,
    botAddress: string,
    underdogData?: {
        amountOfQuestions: number;
        questionIndex: number;
    },
    rabbitholeData?: {
        fuelSubmission: number,
        fuelLeft: number,
        roundIndex: number,
        leavedUsersAddresses: string[],
        version: string,
    },
    bullrunData?: {
        opponentAddress: string,
    }
) => {

    const getSendingParams = (contractName: TContractName) => {
        switch (contractName) {
            case "UNDERDOG":
                const dataU = {
                    questionIndex: underdogData?.questionIndex as number,
                    answerIndex: Math.random() < 0.5 ? 0 : 1,
                    botAddress,
                };

                return {
                    packed: buildUnderdog(
                        dataU.questionIndex,
                        dataU.answerIndex as (0 | 1),
                        dataU.botAddress,
                    ),
                    raw: dataU,
                };
            case "RABBITHOLE":
                const dataR = {
                    fuelSubmission: rabbitholeData?.fuelSubmission as number,
                    fuelLeft: rabbitholeData?.fuelLeft as number,
                    roundIndex: rabbitholeData?.roundIndex as number,
                    botAddress,
                    leavedUsersAddresses: rabbitholeData?.leavedUsersAddresses as string[]
                };

                return {
                    packed: buildRabbithole(
                        dataR.fuelSubmission,
                        dataR.fuelLeft,
                        dataR.roundIndex,
                        dataR.botAddress,
                        dataR.leavedUsersAddresses
                    ),
                    raw: dataR,
                };
            case "BULLRUN":
                const dataB = {
                    perkIndex: Math.floor(Math.random() * 3), // perk index 0, 1 or 2
                    opponentAddress: bullrunData?.opponentAddress as string,
                    botAddress,
                };

                return {
                    packed: buildBullrun(
                        dataB.perkIndex,
                        dataB.opponentAddress,
                        dataB.botAddress,
                    ),
                    raw: dataB,
                };
            default:
                return {
                    packed: "0x",
                    raw: {},
                }
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

        const sendingParams = getSendingParams(contractName);

        // PRE-SUBMIT EVENTS
        switch (contractName) {
            case "RABBITHOLE":
                await handleUpdateProgress({
                    raceId,
                    userAddress: botAddress,
                    property: "rabbithole-set-fuel",
                    value: {
                        fuel: rabbitholeData?.fuelSubmission as number,
                        maxAvailableFuel: rabbitholeData?.fuelLeft as number,
                        isPending: true,
                        version: rabbitholeData?.version as string,
                    },
                }, getIO());
                break;
            case "BULLRUN":
                const opponentSocketId = (await ConnectedUserSchema.findOne({ userAddress: bullrunData?.opponentAddress as string }))?.id;
                await bullrunSetPending(
                    undefined, // socket instance is not required for bot
                    getIO(),
                    {
                        id: "unknown", // bot is not actually connected to the socket
                        opponentId: opponentSocketId,
                        userAddress: botAddress,
                        isPending: true,
                        raceId
                    }
                );
            default:
                break;
        }

        // make move
        const currentNonce = await web3.eth.getTransactionCount(account.address, 'pending');
        const txMakeMove = await blocksheepContract.methods.makeMove(
            contractName,
            raceId,
            sendingParams.packed
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
                    property: "underdog++",
                    value: {
                        completed: (underdogData?.questionIndex as number) + 1,
                        of: underdogData?.amountOfQuestions || 3,
                        // @ts-ignore
                        answer: sendingParams.raw?.answerIndex,
                    }
                }, getIO());
                break;
            case "RABBITHOLE":
                await handleUpdateProgress({
                    raceId,
                    userAddress: botAddress,
                    property: "rabbithole-set-fuel",
                    value: {
                        fuel: rabbitholeData?.fuelSubmission as number,
                        maxAvailableFuel: rabbitholeData?.fuelLeft as number,
                        isPending: false,
                        version: rabbitholeData?.version as string,
                    },
                }, getIO());
                break;
            case "BULLRUN":
                const opponentSocketId = (await ConnectedUserSchema.findOne({ userAddress: bullrunData?.opponentAddress as string }))?.id;
                await bullrunSetPending(
                    undefined, // socket instance is not required for bot
                    getIO(),
                    {
                        id: "unknown", // bot is not actually connected to the socket
                        opponentId: opponentSocketId,
                        userAddress: botAddress,
                        isPending: false,
                        raceId
                    }
                );
                break;
            default:
                break;
        }

        return txMakeMove.transactionHash;
    } catch (err) {
        console.log("Error sending makeMove TX, reason: ", err);
    }
}