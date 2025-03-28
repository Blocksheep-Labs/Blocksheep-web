import GameplayAnimationGif from "../../../assets/images/rabbitholeexpl.gif";

export default function RHRule3() {
    return (
        <div className="flex h-52 rounded-2xl border-[5px] shadow-xl">
            <div className="w-full bg-[#ece0c8] flex flex-row bg-opacity-90">
                <img src={GameplayAnimationGif} alt="gameplay" className="rounded-2xl w-full h-full object-cover"/>
            </div>
        </div>
    );
}