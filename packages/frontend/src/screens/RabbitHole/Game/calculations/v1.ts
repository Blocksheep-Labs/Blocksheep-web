import { config } from "@/config/wagmi";
import { ConnectedUser } from "..";
import { readContract } from "@wagmi/core";
import { BLOCK_SHEEP_CONTRACT } from "@/config/constants";
import BlocksheepAbi from "@/contracts/BlockSheep.json";
import { encodeContractFunctionSendingData } from "@/utils/encodeFunctionData";
import { ethers } from "ethers";

export default async function calculatePlayersV1(players: ConnectedUser[], roundIndex: number, raceId: number) {
    const actualListOfPlayers = players.filter(i => !i.isEliminated) // !i.isCompleted && !i.isEliminated;
    // const submittedFuelIsSimilar = actualListOfPlayers.every(i => i.Fuel === actualListOfPlayers[0].Fuel);
    // console.log({submittedFuelIsSimilar});

    const returnData = await readContract(config, {
      address: BLOCK_SHEEP_CONTRACT,
      abi: BlocksheepAbi,
      functionName: "staticCallAnyGameFunction",
      args: [
        "RABBITHOLE", 
        encodeContractFunctionSendingData("RABBITHOLE_eliminatedAtRound(uint256,uint256)", ["uint256", "uint256"], [raceId, roundIndex])
      ]
    });

    
    const decoded = ethers.utils.defaultAbiCoder.decode(["address"], returnData as any);

    console.log({decoded});
      
    const eliminatedUserAddress = decoded[0];

    const bonuses: { address: string, amount: number }[] = [];

    let newListOfPlayers = actualListOfPlayers.filter(i => i.address.toLowerCase() !== eliminatedUserAddress.toLowerCase());
    
    //const sorted = actualListOfPlayers.toSorted((a, b) => a.address.localeCompare(b.address)).toSorted((a, b) => a.Fuel - b.Fuel);
    //console.log({actualListOfPlayers});
    //newListOfPlayers = sorted.slice(1, actualListOfPlayers.length);

    return { newListOfPlayers, bonuses, eliminatedUserAddress };
}