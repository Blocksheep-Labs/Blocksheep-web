import Swords from "../../../assets/fight.png";
import Shield from "../../../assets/defence.png";
import Run from "../../../assets/run.png";

export default function BRule1() {
    return (
        <div className="flex h-32 rounded-2xl border-[5px] shadow-xl">
            <div className="w-full bg-[#ece0c8] flex flex-row bg-opacity-90">
                <div className="w-[52%] text-lg flex items-center justify-center text-center p-2">
                    1vs1 like rock-paper-scissors
                </div>

                <div className="flex flex-col w-[48%] rounded-xl flex items-center justify-center relative">
                    <img src={Shield} alt="shield" className="w-10 absolute left-2 bottom-4"/>
                    <img src={Swords} alt="swords" className="w-10 absolute top-4"/>
                    <img src={Run} alt="run" className="w-10 absolute right-2 bottom-4"/>
                </div>
            </div>
        </div>
    );
}