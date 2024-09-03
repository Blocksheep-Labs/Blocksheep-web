import { useNavigate, useParams } from "react-router-dom";
import { socket } from "../utils/socketio";
import { useSmartAccount } from "../hooks/smartAccountProvider";

export default function Bullrun() {
    const {smartAccountAddress} = useSmartAccount();
    const navigate = useNavigate();
    const {raceId} = useParams();

    const handleNavigate = () => {
        socket.emit("update-progress", {
            raceId,
            userAddress: smartAccountAddress,
            property: "game3-complete",
        });
        navigate(`/race/${raceId}/stats`);
    }

    return (
        <div className="mx-auto flex h-dvh w-full flex-col bg-bullrun_bg bg-cover bg-[110%] justify-center items-center gap-4">
            <p className="text-white text-2xl font-bold text-center bg-black">WORK IN PROGRESS</p>
            <button 
                onClick={handleNavigate}
                className="px-7 py-4 bg-[#eec245] w-28 border-[1px] border-black rounded-xl text-2xl"
            >
                NEXT
            </button>
        </div>
    );
}