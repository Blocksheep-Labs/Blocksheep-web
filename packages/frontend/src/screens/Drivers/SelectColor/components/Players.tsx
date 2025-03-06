import levelsData from "@/config/levels.json";
import { sheepImages } from "@/utils/sheepsImagesArray";


const determineUserLevel = (gamesAboveAverage: number) => {
  const level = levelsData.find(i => i.requiredGames == gamesAboveAverage);
  return level?.level || 1;
}


export default function Players({ 
  sheepsMap, 
  warcryMap,
  usersData,
}: { 
  sheepsMap: Map<string, number>, 
  warcryMap: Map<string, number>,
  usersData: any[],
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5 mt-4 px-3">
      {Object.entries(sheepsMap).map(([userAddress, selectedSheep], index) => (
        <div
          key={index}
          className="flex flex-col-reverse h-20 relative my-0.5 border-[4px] border-[#2a3f86] rounded-xl bg-gray-100 text-center"
          style={{
            background: "linear-gradient(90deg, rgba(81,112,218,1) 0%, rgba(42,63,134,1) 100%)",
          }}
        >
          <img
            src={sheepImages[selectedSheep]}
            alt={userAddress}
            className={`absolute w-20 h-20 -translate-y-2 object-contain`}
          />
          <div
            className="w-full h-5 rounded-b-xl flex text-white items-center relative border-t-[4px] border-t-[#2a3f86] pl-0.5"
            style={{
              background: "linear-gradient(90deg, rgba(81,112,218,1) 0%, rgba(42,63,134,1) 100%)",
            }}
          >
            <div className="text-[11px] font-bold pt-1">{usersData.find(i => i.address == userAddress)?.name || "Unknonwn"}</div>
            <div className="absolute text-black text-base right-0 bg-yellow-600 rounded-full p-1 pt-[3px] w-[26px] h-[26px] translate-y-[2px] translate-x-[8px]">
              {determineUserLevel(usersData.find(i => i.address == userAddress)?.gamesAboveAverage || 0)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};