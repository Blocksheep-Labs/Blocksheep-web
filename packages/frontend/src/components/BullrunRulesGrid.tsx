import Shield from "../assets/bullrun/defence.png";
import Swords from "../assets/bullrun/fight.png";
import BullHead from "../assets/bullrun/run.png";

export default function BullrunRulesGrid({
    pointsMatrix
}: {
    pointsMatrix: number[][]
}) {
    return (
        <div className="grid gap-[3px] bg-white mx-10 mt-5 font-bold p-[3px] grid-cols-4 grid-rows-4 w-fit">
            <div className="h-[70px] w-[70px] bg-gray-300 relative p-1">
                <span className="absolute bottom-0 text-xl">YOU</span>
                <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0">
                    <line x1="100" y1="100" x2="0" y2="0" stroke="black" />
                </svg>
                <div className="absoluite flex flex-col gap-0 justify-end items-end">
                    <span className="text-[7.5px] text-wrap w-10 text-start">YOUR</span>
                    <span className="text-[7.5px] text-wrap w-10 text-start">OPPONENT</span>
                </div>
            </div>
            <div className="flex items-center justify-center bg-gray-300"><img src={Swords} alt="swords" className="w-12"/></div>
            <div className="flex items-center justify-center bg-gray-300"><img src={Shield} alt="shield" className="w-12"/></div>
            <div className="flex items-center justify-center bg-gray-300"><img src={BullHead} alt="run"  className="w-12"/></div>

            <div className="flex items-center justify-center bg-gray-300"><img src={Swords} alt="swords" className="w-12"/></div>
            {
                pointsMatrix[0].map((i, key) => {
                    return (
                        <div key={key} className={`flex items-center justify-center ${i < 0 ? 'bg-red-400' : 'bg-green-400'} ${i == 0 && 'bg-gray-400'} text-2xl`}>{Number(i)}</div>
                    );
                })
            }

            <div className="flex items-center justify-center bg-gray-300"><img src={Shield} alt="shield" className="w-12"/></div>
            {
                pointsMatrix[1].map((i, key) => {
                    return (
                        <div key={key} className={`flex items-center justify-center ${i < 0 ? 'bg-red-400' : 'bg-green-400'} ${i == 0 && 'bg-gray-400'} text-2xl`}>{Number(i)}</div>
                    );
                })
            }

            <div className="flex items-center justify-center bg-gray-300"><img src={BullHead} alt="run" className="w-12"/></div>
            {
                pointsMatrix[2].map((i, key) => {
                    return (
                        <div key={key} className={`flex items-center justify-center ${i < 0 ? 'bg-red-400' : 'bg-green-400'} ${i == 0 && 'bg-gray-400'} text-2xl`}>{Number(i)}</div>
                    );
                })
            }
        </div>
    );
}