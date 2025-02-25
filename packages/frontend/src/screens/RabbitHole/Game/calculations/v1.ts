import { ConnectedUser } from "..";

export default function calculatePlayersV1(players: ConnectedUser[]) {
    const actualListOfPlayers = players.filter(i => !i.isEliminated) // !i.isCompleted && !i.isEliminated;
    // const submittedFuelIsSimilar = actualListOfPlayers.every(i => i.Fuel === actualListOfPlayers[0].Fuel);
    // console.log({submittedFuelIsSimilar});

    const bonuses: { address: string, amount: number }[] = [];

    let newListOfPlayers;
    // if (!submittedFuelIsSimilar) {
      const sorted = actualListOfPlayers.toSorted((a, b) => a.address.localeCompare(b.address)).toSorted((a, b) => a.Fuel - b.Fuel);
      console.log({actualListOfPlayers});
      newListOfPlayers = sorted.slice(1, actualListOfPlayers.length);
    // } else {
    //   newListOfPlayers = actualListOfPlayers;
    // }

    return { newListOfPlayers, bonuses };
}