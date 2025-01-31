import { FC } from "react";
import SHEEP_ICONS from "../../assets/select-sheep-arr.json";

const players = [
  { name: "Player1", level: 5 },
  { name: "Player2", level: 8 },
  { name: "Player3", level: 12 },
  { name: "Player4", level: 3 },
  { name: "Player5", level: 7 },
  { name: "Player6", level: 10 },
  { name: "Player7", level: 6 },
];

const Players: FC = () => {
  const icon = SHEEP_ICONS[0];

  return (
    <div className="grid grid-cols-3 gap-2.5 mt-4 px-3">
      {players.map((player, index) => (
        <div
          key={index}
          className="flex flex-col-reverse h-20 relative my-0.5 border-[4px] border-[#2a3f86] rounded-xl bg-gray-100 text-center"
          style={{
            background: "linear-gradient(90deg, rgba(81,112,218,1) 0%, rgba(42,63,134,1) 100%)",
          }}
        >
          <img
            src={`/src/assets/sheep/${icon.name}`}
            alt={icon.name}
            className={`absolute w-20 h-20 -translate-y-2 object-contain ${!icon.isAvailable && "opacity-30"}`}
          />
          <div
            className="w-full h-5 rounded-b-xl flex text-white items-center relative border-t-[4px] border-t-[#2a3f86] pl-0.5"
            style={{
              background: "linear-gradient(90deg, rgba(81,112,218,1) 0%, rgba(42,63,134,1) 100%)",
            }}
          >
            <div className="text-[11px] font-bold pt-1">{player.name}</div>
            <div className="absolute text-black text-base right-0 bg-yellow-600 rounded-full p-1 pt-[3px] w-[26px] h-[26px] translate-y-[2px] translate-x-[8px]">
              {player.level}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Players;
