import { usePrivy } from "@privy-io/react-auth";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";
import { socket } from "../utils/socketio";
import RibbonLabel from "../components/RibbonLabel";
import Rule from "../components/Rule";


export default function RabbitHoleRules() {
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
                property: "game2-rules-complete",
            });
            socket.emit('update-progress', {
                raceId,
                userAddress: user?.wallet?.address,
                property: "game2-rules-complete",
            });

            navigate(`/race/${raceId}/rabbit-hole`, {
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
                <Rule text="SET UP YOUR SPEED BEFORE GOING INTO THE TUNNEL"/>
                <Rule text="MORE SPEED = MORE FUEL CONSUMED"/>
                <Rule text="SURVIVE! YOU ARE ELIMINATED IF..."/>
                <Rule text="1) YOU ARE THE LAST ONE (SPEED IS TOO LOW)"/>
                <Rule text="2) YOU RUN OUT FUEL"/>
            </div>
        </div>
    );
}