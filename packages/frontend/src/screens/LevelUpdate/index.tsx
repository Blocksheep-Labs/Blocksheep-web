import StairsImage from "./assets/images/stairs.png"
import ProgressImage from "./assets/images/progress.png";
import SheepImage from "./assets/images/blacksheep.png";
import { useEffect, useRef, useState } from "react";

import "./assets/css/jumps.css";
import { useNavigate, useParams } from "react-router-dom";
import { useSmartAccount } from "@/hooks/smartAccountProvider";
import { httpGetRaceDataById, httpGetUserDataByAddress } from "@/utils/http-requests";
import TopPageTimer from "@/components/top-page-timer/TopPageTimer";
import levelsData from "@/config/levels.json";
import { useRaceById } from "@/hooks/useRaceById";
import getScreenTime from "@/utils/getScreenTime";
import { sheepImages } from "@/utils/sheepsImagesArray";

// bottom - px, left - %
const positionsByLevel = {
    1: {
        bottom: -5, 
        left: 22,
    },
    2: {
        bottom: 30,
        left: 26,
    },
    3: {
        bottom: 65,
        left: 30,
    },
    4: {
        bottom: 95,
        left: 35,
    } ,
    5: {
        bottom: 125,
        left: 40,
    },
    6: {
        bottom: 155,
        left: 44,
    },
    7: {
        bottom: 185,
        left: 48,
    },
    8: {
        bottom: 220,
        left: 52,
    },
    9: {
        bottom: 255,
        left: 56,
    },
    10: {
        bottom: 290,
        left: 60,
    },
}

const SCREEN_NAME = "LEVEL_UPDATE";

export default function LevelUpdateScreen() {
    const navigate = useNavigate();
    const {raceId} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const [secondsVisual, setSecondsVisual] = useState(1000);
    const [level, setLevel] = useState<number | null>(null);
    const { race } = useRaceById(Number(raceId));
    const [raceUsersDataColors, setRaceUsersDataColors] = useState<Map<string, number>>(new Map());

    const tipRefAbove = useRef<HTMLDivElement>(null);
    const tipRefBelow = useRef<HTMLDivElement>(null);
    const sheepRef = useRef<HTMLImageElement>(null);


    const determineUserLevel = (gamesAboveAverage: number) => {
        const level = levelsData.find(i => i.requiredGames == gamesAboveAverage);
        return level?.level || 1;
    }


    useEffect(() => {
        if (
            sheepRef.current &&
            tipRefBelow.current && 
            tipRefAbove.current &&
            smartAccountAddress
        ) {
            const sheepObject = sheepRef.current;
            const tipObjectAbove = tipRefAbove.current;
            const tipObjectBelow = tipRefBelow.current;

            httpGetUserDataByAddress(smartAccountAddress).then(({data}) => {
                let previousGamesAboveAverage = 0, 
                    newGamesAboveAverage = 0;

                const gamesData = data.user.finishedRaces?.find((i: any) => i.raceId == raceId);

                if (gamesData) {
                    previousGamesAboveAverage = gamesData.previousGamesAboveAverage;
                    newGamesAboveAverage = gamesData.newGamesAboveAverage;
                }

                // update level states
                console.log({newGamesAboveAverage, previousGamesAboveAverage})
                const userLevel = determineUserLevel(previousGamesAboveAverage);
                const newUserLevel = determineUserLevel(newGamesAboveAverage);
                setLevel(userLevel);

                const key = userLevel as keyof typeof positionsByLevel;
                sheepObject.style.left = `${positionsByLevel[key].left}%`;
                sheepObject.style.bottom = `${positionsByLevel[key].bottom}px`;
                sheepObject.style.opacity = '1';

                const newLevelkey = newUserLevel as keyof typeof positionsByLevel;
                if (newGamesAboveAverage > previousGamesAboveAverage) {
                    // above average
                    setTimeout(() => {
                        tipObjectAbove.style.left = '-10px';
                        setLevel(newUserLevel);
                        sheepObject.style.left = `${positionsByLevel[newLevelkey].left}%`;
                        sheepObject.style.bottom = `${positionsByLevel[newLevelkey].bottom}px`;
                    }, 1700);
                    //sheepObject.classList.add('jump-to-top-animation');
                } else if (newGamesAboveAverage < previousGamesAboveAverage) {
                    // below average
                    setTimeout(() => {
                        tipObjectBelow.style.left = '-10px';
                        setLevel(newUserLevel);
                        sheepObject.style.left = `${positionsByLevel[newLevelkey].left}%`;
                        sheepObject.style.bottom = `${positionsByLevel[newLevelkey].bottom}px`;
                    }, 1700);
                    //sheepObject.classList.add('jump-to-bottom-animation');
                } else if (newGamesAboveAverage == previousGamesAboveAverage) {
                    // no progress (0 == 0)
                    setTimeout(() => {
                        tipObjectBelow.style.left = '-10px';
                        setLevel(newUserLevel);
                    }, 1700);
                }
                
            });
        }
    }, [sheepRef, tipRefAbove, tipRefBelow, smartAccountAddress]);


    
    useEffect(() => {
        if (raceId?.length && smartAccountAddress && sheepRef.current && race) {
            httpGetRaceDataById(`race-${raceId}`)
            .then(({data}) => {
                console.log({data});

                setRaceUsersDataColors(new Map(Object.entries(data.race.usersSheeps)));


                // VALIDATE USER FOR BEING REGISTERED
                if (!race.registeredUsers.includes(smartAccountAddress)) {
                    //console.log("USER IS NOT LOGGED IN !!!!!!!!!!!!!!", data.registeredUsers, smartAccountAddress)
                    navigate('/', { replace: true });
                }
                /*
                const myPoints = newProgress.find(i => i.address == smartAccountAddress)?.curr || 0;
                const total = newProgress.reduce((sum, stat) => sum + stat.curr, 0);
                const average = total / newProgress.length;
                

                if (average > myPoints) {
                    setAverageStatus("below");
                } else {
                    setAverageStatus("above");
                }
                */
                httpGetRaceDataById(`race-${race.id}`).then(({data}) => {
                    const expectedTime = getScreenTime(data, SCREEN_NAME);
                    setSecondsVisual(expectedTime);
    
                    setTimeout(() => {
                        navigate('/select');
                    }, expectedTime * 1000);
                });
            });
        }
    }, [raceId, smartAccountAddress, race]);

    return (
        <div className="relative w-full h-full bg-gradient-to-b from-[#5861c8] to-[#84bbf4]">
             <TopPageTimer duration={secondsVisual * 1000} />
            <div className="z-50 absolute top-72 -left-64 transition-all duration-[1500ms]" ref={tipRefAbove}>
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

            <div className="z-50 absolute top-72 -left-64 transition-all duration-[1500ms]" ref={tipRefBelow}>
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
                    Current level: {(level === null) ? '--' : level}
                </div>
            </div>
            <div className="absolute bottom-3">
                <div className="relative">
                    <img src={StairsImage} alt="stairs" className="scale-[1.07] w-full"/>

                    {
                        smartAccountAddress && raceUsersDataColors &&
                        <img 
                            ref={sheepRef} 
                            src={sheepImages[raceUsersDataColors.get(smartAccountAddress) || 0]} 
                            alt="sheep" 
                            className="w-16 absolute z-30 -bottom-[5px] left-[22%] transition-all opacity-0 duration-[1500ms]"
                        />
                    }
                </div>
            </div>
        </div>
    );
}