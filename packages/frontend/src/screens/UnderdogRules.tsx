import { usePrivy } from "@privy-io/react-auth";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";
import { socket } from "../utils/socketio";
import RibbonLabel from "../components/RibbonLabel";
import Rule from "../components/Rule";


export default function UnderdogRules() {
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
                property: "game1-rules-complete",
            });
            socket.emit('update-progress', {
                raceId,
                userAddress: user?.wallet?.address,
                property: "game1-rules-complete",
            });
            navigate(`/race/${raceId}/underdog`, {
                state: location.state
            });
        },
        autoStart: true
    });


    return (
        <div className="mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom">
            <div className="w-full bg-gray-200 h-2.5 dark:bg-gray-700">
                <div className="bg-yellow-500 h-2.5" style={{width: `${totalSeconds * 10}%`}}></div>
            </div>
            <div className="mt-7 flex w-full justify-center">
                <RibbonLabel text="RULES"/>
            </div>
            <div className="h-full flex flex-col gap-3 px-10 mt-4">
                <Rule text="SWIPE LEFT OR RIGHT TO ANSWER QUESTIONS"/>
                <Rule text="WIN IF YOU ARE IN THE MINORITY GROUP"/>
                <Rule text="IS IT BETTER TO HAVE NICE OR SMART KIDS?" showExample/>
            </div>
        </div>
    );
}