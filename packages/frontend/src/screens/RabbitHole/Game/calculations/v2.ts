import { ConnectedUser } from "../Rabbithole";

// last one doesn’t get eliminated if difference with second-to-last one is > 4. They get +3 fuel bonus.
// Second-to-last one doesn’t consume fuel. second-to-last one = предпоследний

export default function calculatePlayersV2(players: ConnectedUser[]) {
    const actualListOfPlayers = players.filter(i => !i.isCompleted && !i.isEliminated);
    // const submittedFuelIsSimilar = actualListOfPlayers.every(i => i.Fuel === actualListOfPlayers[0].Fuel);
    // console.log({submittedFuelIsSimilar});

    const bonuses: { address: string, amount: number }[] = [];

    let newListOfPlayers;
    // if (!submittedFuelIsSimilar) {
      const sorted = actualListOfPlayers.toSorted((a, b) => a.id - b.id).toSorted((a, b) => a.Fuel - b.Fuel);
      console.log({actualListOfPlayers});
        
      // last one doesn’t get eliminated if difference with second-to-last one is > 4. He'll get +3 fuel bonus.
      if (sorted[1].Fuel - sorted[0].Fuel > 4) {
        bonuses.push({ address: sorted[0].address, amount: 3 });
        newListOfPlayers = actualListOfPlayers;
      } else {
        newListOfPlayers = sorted.slice(1, actualListOfPlayers.length);
      }
      // second-to-last one doesn’t consume fuel.
      bonuses.push({ address: sorted[1].address, amount: sorted[1].Fuel });

    // } else {
    //   newListOfPlayers = actualListOfPlayers;
    // }

    return { newListOfPlayers, bonuses };
}