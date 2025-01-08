import StairsImage from "./assets/images/stairs.png"
import ProgressImage from "./assets/images/progress.png";
import SheepImage from "./assets/images/blacksheep.png";
import { useEffect, useRef, useState } from "react";

import "./assets/css/jumps.css";
import { useNavigate, useParams } from "react-router-dom";
import { useSmartAccount } from "../../../hooks/smartAccountProvider";
import { getRaceById } from "../../../utils/contract-functions";
import { httpGetRaceDataById } from "../../../utils/http-requests";
import TopPageTimer from "../../../components/top-page-timer/TopPageTimer";
import { socket } from "../../../utils/socketio";

export default function LevelUpdateScreen() {
    const navigate = useNavigate();
    const {raceId} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const [stats, setStats] = useState<{curr: number; address: string}[] | undefined>(undefined);
    const [users, setUsers] = useState<any[]>([]);
    const [averageStatus, setAverageStatus] = useState<"above" | "below" | null>(null);
    const [secondsVisual, setSecondsVisual] = useState(1000);

    const tipRefAbove = useRef<HTMLDivElement>(null);
    const tipRefBelow = useRef<HTMLDivElement>(null);
    const sheepRef = useRef<HTMLImageElement>(null);


    useEffect(() => {
        if (sheepRef.current && averageStatus && tipRefBelow.current && tipRefAbove.current) {
            const sheepObject = sheepRef.current;
            const tipObjectAbove = tipRefAbove.current;
            const tipObjectBelow = tipRefBelow.current;

            if (averageStatus == "below") {
                setTimeout(() => {
                    tipObjectBelow.style.left = '-10px';
                }, 1700);
                sheepObject.classList.add('jump-to-bottom-animation');
            } else if (averageStatus == "above") {
                setTimeout(() => {
                    tipObjectAbove.style.left = '-10px';
                }, 1700);
                sheepObject.classList.add('jump-to-top-animation');
            }
        }
    }, [sheepRef, averageStatus, tipRefAbove, tipRefBelow]);


    
    useEffect(() => {
        if (raceId?.length && smartAccountAddress && sheepRef.current) {
            Promise.all([
                getRaceById(Number(raceId), smartAccountAddress as `0x${string}`),
                httpGetRaceDataById(`race-${raceId}`),
            ]).then(data => {
                return {
                    contractData: data[0],
                    serverData: data[1].data,
                }
            }).then(data => {
                console.log({data});
                // VALIDATE USER FOR BEING REGISTERED
                if (!data.contractData.registeredUsers.includes(smartAccountAddress)) {
                    //console.log("USER IS NOT LOGGED IN !!!!!!!!!!!!!!", data.registeredUsers, smartAccountAddress)
                    navigate('/', { replace: true });
                }

                let newProgress: { curr: number; address: string }[] = data.contractData.progress.map(i => {
                    return { curr: Number(i.progress), address: i.user };
                });
                setStats(newProgress.toSorted((a, b) => b.curr - a.curr));

                const myPoints = newProgress.find(i => i.address == smartAccountAddress)?.curr || 0;
                const total = newProgress.reduce((sum, stat) => sum + stat.curr, 0);
                const average = total / newProgress.length;
                

                if (average > myPoints) {
                    setAverageStatus("below");
                } else {
                    setAverageStatus("above");
                }

                console.log("PROGRESS:", newProgress);

                setSecondsVisual(10);
                
                setUsers(data.serverData.race.users);

                setTimeout(() => {
                    navigate('/select');
                }, 10 * 1000);
            });
        }
    }, [raceId, smartAccountAddress]);

    return (
        <div className="relative w-full h-full bg-gradient-to-b from-[#5861c8] to-[#84bbf4]">
             <TopPageTimer duration={secondsVisual * 1000} />
            <div className="z-50 absolute top-72 -left-64 transition-all duration-800" ref={tipRefAbove}>
                <div className="relative">
                    <div 
                        className="
                            w-52 h-10 bg-[#a3ae9e] border-[5px] 
                            border-white text-black flex items-center justify-center
                            shadow-lg
                        "
                        style={{ background: `radial-gradient(circle, rgba(137,170,117,1) 70%, rgba(74,111,44,1) 100%)` }}
                    >
                        Above average
                    </div>
                    <div 
                        className="
                            absolute -right-10 -top-3 
                            w-16 h-16 rounded-full 
                            bg-red-400 flex items-center justify-center 
                            text-white border-[5px] border-white
                            shadow-lg text-3xl
                        "
                        style={{ background: `radial-gradient(circle, rgba(137,170,117,1) 0%, rgba(74,111,44,1) 100%)` }}
                    >
                        +1
                    </div>
                </div>
            </div>

            <div className="z-50 absolute top-72 -left-64 transition-all duration-800" ref={tipRefBelow}>
                <div className="relative">
                    <div 
                        className="
                            w-52 h-10 bg-[#a3ae9e] border-[5px] 
                            border-white text-black flex items-center justify-center
                            shadow-lg
                        "
                        style={{ background: `radial-gradient(circle, rgba(255,158,158,1) 0%, rgba(218,81,81,1) 100%)` }}
                    >
                        Below average
                    </div>
                    <div 
                        className="
                            absolute -right-10 -top-3 
                            w-16 h-16 rounded-full 
                            bg-red-400 flex items-center justify-center 
                            text-white border-[5px] border-white
                            shadow-lg text-3xl
                        "
                        style={{ background: `radial-gradient(circle, rgba(255,158,158,1) 0%, rgba(218,81,81,1) 100%)` }}
                    >
                        -1
                    </div>
                </div>
            </div>

            <div className="z-30 absolute top-0 p-10 flex flex-col items-center justify-center">
                <img src={ProgressImage} alt="progress" />
                <div className="w-48 mt-1 border-[4px] border-[#7e99ce] rounded-xl h-8 bg-[#030119] text-[#dac260] flex items-center justify-center text-[12px]">
                    Current level: 1
                </div>
            </div>
            <div className="absolute bottom-3">
                <div className="relative">
                    <img src={StairsImage} alt="stairs" className="scale-[1.07] w-full"/>

                    <img ref={sheepRef} src={SheepImage} alt="sheep" className="w-16 absolute z-30 -bottom-[5px] left-[22%]"/>
                </div>
            </div>
        </div>
    );
}