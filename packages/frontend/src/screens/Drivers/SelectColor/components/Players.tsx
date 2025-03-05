import i1 from "../../assets/images/sheep/1.png";
import i2 from "../../assets/images/sheep/2.png";
import i3 from "../../assets/images/sheep/3.png";
import i4 from "../../assets/images/sheep/4.png";
import i5 from "../../assets/images/sheep/5.png";
import i6 from "../../assets/images/sheep/6.png";
import i7 from "../../assets/images/sheep/7.png";
import i8 from "../../assets/images/sheep/8.png";
import i9 from "../../assets/images/sheep/9.png";
import i10 from "../../assets/images/sheep/10.png";
import i11 from "../../assets/images/sheep/11.png";
import i12 from "../../assets/images/sheep/12.png";
import i13 from "../../assets/images/sheep/13.png";
import i14 from "../../assets/images/sheep/14.png";
import i15 from "../../assets/images/sheep/15.png";
import i16 from "../../assets/images/sheep/16.png";
import shortenAddress from "@/utils/shortenAddress";


const sheepImages = [
  i1, i2, i3, i4, i5, i6, i7, i8, i9, i10, i11,
  i12, i13, i14, i15, i16,
];

export default function Players({ sheepsMap, warcryMap }: { sheepsMap: Map<string, number>, warcryMap: Map<string, number> }) {
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
            <div className="text-[11px] font-bold pt-1">{shortenAddress(userAddress)}</div>
            <div className="absolute text-black text-base right-0 bg-yellow-600 rounded-full p-1 pt-[3px] w-[26px] h-[26px] translate-y-[2px] translate-x-[8px]">
              {0}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};