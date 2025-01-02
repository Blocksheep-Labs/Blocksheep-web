import Swords from "../../../assets/fight.png";
import Shield from "../../../assets/defence.png";
import Run from "../../../assets/run.png";

export default function BRule3() {
    return (
        <div className="flex flex-col gap-1 h-fit rounded-2xl items-center justify-center">
            <div className="bg-white bg-opacity-90 flex flex-row rounded-xl shadow-xl">
                <div className="rounded-xl h-fit p-1">
                    <img src={Swords} alt="swords" className="w-5 h-5"/>
                    <p className="w-full text-center text-green-600">+1</p>
                </div>
                <div className="rounded-xl h-fit p-1">
                    <img src={Shield} alt="shield" className="w-5 h-5"/>
                    <p className="w-full text-center">0</p>
                </div>
                <div className="rounded-xl h-fit p-1">
                    <img src={Run} alt="run" className="w-5 h-5"/>
                    <p className="w-full text-center text-red-600">-1</p>
                </div>
            </div>
            <div className="w-full flex flex-row gap-3">
                <div className="bg-white bg-opacity-90 rounded-xl h-fit p-2 shadow-xl">
                    <img src={Swords} alt="swords" className="w-16 h-16"/>
                </div>
                <div className="bg-white bg-opacity-90 rounded-xl h-fit p-2 shadow-xl">
                    <img src={Shield} alt="shield" className="w-16 h-16"/>
                </div>
                <div className="bg-white bg-opacity-90 rounded-xl h-fit p-2 shadow-xl">
                    <img src={Run} alt="run" className="w-16 h-16"/>
                </div>
            </div>
        </div>
    );
}