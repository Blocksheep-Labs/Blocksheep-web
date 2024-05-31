// import _ from "lodash";
// import { useGame } from "@/providers/GameProvider"

const TableBody = () => {
  // const { players, isOpenChannel } = useGame();
  // const totalPlayers = players.length;
  // const sortedPlayers = _.sortBy(players, "speed").reverse();

  return (
    <tbody className="bg-white">
      {/* {sortedPlayers.map((list, index) => (
        <tr
          // eslint-disable-next-line
          key={index}
          className={`${index + 1 === totalPlayers && totalPlayers > 2 ? "text-red" : ""}`}
        >
          <td>{list.name}</td>
          <td>{isOpenChannel ? "N/A" : list.speed.toString()}</td>
          <td>{isOpenChannel ? "N/A" : list.fuel.toString()}</td>
          <td>{isOpenChannel ? "N/A" : index + 1}</td>
        </tr>
      ))} */}
    </tbody>
  );
};

export default TableBody;
