import { usePrivy } from "@privy-io/react-auth";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";
import { socket } from "../utils/socketio";

export default function UnderdogCover() {
    const navigate = useNavigate();
    const {raceId} = useParams();
    const {user} = usePrivy();
    const location = useLocation();

    const time = new Date();
    time.setSeconds(time.getSeconds() + 10);

    const { totalSeconds } = useTimer({
        expiryTimestamp: time,
        onExpire: () => {
            console.log("UPDATE PROGRESS", {
                raceId,
                userAddress: user?.wallet?.address,
                property: "game1-preview-complete",
            });
            socket.emit('update-progress', {
                raceId,
                userAddress: user?.wallet?.address,
                property: "game1-preview-complete",
            });
            navigate(`/race/${raceId}/underdog/rules`, {
                state: location.state
            });
        },
        autoStart: true
    });


    return (
        <div className="mx-auto flex h-dvh w-full flex-col bg-underdog_cover_bg bg-cover bg-bottom">
            <div className="w-full bg-gray-200 h-2.5 dark:bg-gray-700">
                <div className="bg-yellow-500 h-2.5" style={{width: `${totalSeconds * 10}%`}}></div>
            </div>
        </div>
    );
}