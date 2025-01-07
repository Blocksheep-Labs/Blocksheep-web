import RulesGridGif from "../../../assets/grid2.gif";

export default function BRule3() {
    return (
        <div className="flex h-64 w-64 min-w-full rounded-2xl border-[5px] shadow-xl">
            <div className="w-full bg-[#ece0c8] flex flex-row bg-opacity-90">
                <img src={RulesGridGif} alt="gameplay" className="rounded-2xl w-full h-full object-cover"/>
            </div>
        </div>
    );
}