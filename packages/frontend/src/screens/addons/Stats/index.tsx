import { useNavigate, useParams } from "react-router-dom";
import {useEffect, useState} from "react";
import {getRaceById} from "../../../utils/contract-functions";
import {useSmartAccount} from "../../../hooks/smartAccountProvider";
import shortenAddress from "../../../utils/shortenAddress";
import WhiteSheepImage from "./assets/images/sheeepy.png";
import BlackSheepImage from "./assets/images/blacksheep.png";
import NextFlag from "../../../assets/common/flag.png";
import { httpGetRaceDataById } from "../../../utils/http-requests";
import PodiumBGImage from "./assets/images/podiumbg.png";
import generateLink from "../../../utils/linkGetter";
import ArrowUpImage from "./assets/images/arrow-up.png";
import ArrowDownImage from "./assets/images/arrow-down.png";
import FlagsImage from "./assets/images/flags.png";

export default function StatsScreen() {
    const navigate = useNavigate();
    const {raceId} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const [stats, setStats] = useState<{curr: number; address: string}[] | undefined>(undefined);
    const [users, setUsers] = useState<any[]>([]);
    const [avgLineExists, setAvgLineExists] = useState(false);
    
    const date = new Date();

    const handleMoveToNext = () => {
        navigate(generateLink("LEVEL_UPDATE", Number(raceId)));
    }

    useEffect(() => {
        if (raceId?.length && smartAccountAddress) {
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
                
                /*
                setStats(
                    [
                        {curr: 6, address: 'addr1'},
                        {curr: 6, address: 'addr2'}
                    ]
                );
                */
                
                
                console.log("PROGRESS:", newProgress);
                
                setUsers(data.serverData.race.users);
                
                /*
                setUsers([
                    {
                        address: "0xd8Fa137051acD7f3964524485be4b9A10CA22E94",
                        name: "bada9te",
                    },
                    {
                        address: "0xd8ea137051acD7f3964524485be4b9A10CA22E94",
                        name: "bada9te2",
                    },
                    {
                        address: "0xd8na137051acD7f3964524485be4b9A10CA22E94",
                        name: "bada9te1",
                    }
                ]);
                */
            });
        }
    }, [raceId, smartAccountAddress]);


    const scoreAboveAverage = (score: number) => {
        const avg = Number(stats?.map(i => i.curr).reduce((curr, next) => curr + next, 0)) / Number(stats?.length);

        return score >= Number(avg);
    }

    const formattedDate = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "2-digit",
    });

    const getSheepPositions = () => {
        const height = window.innerHeight;
        console.log({height})

        if (height < 670) {
            return [
                { left: '27%', top: '55%' },  // Position for left sheep
                { left: '50%', top: '47%' },  // Position for center sheep
                { right: '22%', top: '45%' }   // Position for right sheep
            ];
        } else {
            return [
                { left: '22%', top: '57%' },  // Position for left sheep
                { left: '50%', top: '50%' },  // Position for center sheep
                { right: '20%', top: '50%' }   // Position for right sheep
            ];
        }
    };

    let belowAverageShown = false; // Flag to track if the message has been shown

    return (
        <div className={`relative mx-auto flex w-full flex-col bg-center bg-top bg-cover`} style={{ height: `${window.innerHeight}px`, backgroundImage: `url(${PodiumBGImage})` }}>
            <div className="h-full w-full flex justify-center relative">
                {
                    users && users.length >= 2 &&
                    <div 
                        className={`absolute w-12 flex items-center justify-center flex-col`} 
                        style={{ 
                            top: getSheepPositions()[0].top,
                            left: getSheepPositions()[0].left
                        }}
                    >
                        { 
                            // LEFT
                        }
                        <p className="bg-black text-center text-white text-[8px] p-1 rounded-md z-10 w-full">
                            {stats && users && (users.find(j => j.address == stats[1]?.address)?.name || "Unknown")} 
                        </p>
                        <img src={`${stats && (smartAccountAddress === stats[1]?.address) ? BlackSheepImage : WhiteSheepImage}`} className="h-12" alt="left"/>
                    </div>
                }
                
                {
                    users && users.length >= 1 &&
                    <div 
                        className={`absolute w-12 flex items-center justify-center flex-col`} 
                        style={{ 
                            transform: 'translate(-50%, -50%)',
                            top: getSheepPositions()[1].top,
                            left: getSheepPositions()[1].left
                        }}
                    >
                        { 
                            // CENTER
                        }
                        <p className="bg-black text-center text-white text-[8px] p-1 rounded-md z-10 w-full">
                            {stats && users && users.find(j => j.address == stats[0]?.address)?.name || "Unknown"} 
                        </p>
                        <img src={`${stats && (smartAccountAddress === stats[0]?.address) ? BlackSheepImage : WhiteSheepImage}`} className="h-12" alt="center"/>
                    </div>
                }

                {
                    users && users.length >= 3 &&
                    <div 
                        className={`absolute w-12 flex items-center justify-center flex-col`}
                        style={{ 
                            top: getSheepPositions()[2].top,
                            right: getSheepPositions()[2].right
                        }}
                    >
                        { 
                            // RIGHT
                        }
                        <p className="bg-black text-center text-white text-[8px] p-1 rounded-md z-10 w-full">
                            {stats && users && (users.find(j => j.address == stats[2]?.address)?.name || "Unknown")} 
                        </p>
                        <img src={`${stats && (smartAccountAddress === stats[2]?.address) ? BlackSheepImage : WhiteSheepImage}`} className="h-12" alt="right"/>
                    </div>
                }

                {
                    /*
                        <p className="text-white font-bold text-center absolute top-[40%] w-full">
                            {
                                date.toLocaleDateString("en-GB", {
                                    year: "numeric",
                                    month: "2-digit",
                                    day: "2-digit",
                                })
                            }
                        </p>
                    */
                }
            </div>
            <div className="h-full px-10 pb-10 relative">
                <img src={FlagsImage} alt="flags" className="w-16 h-16 rotate-45 absolute -top-[35px] right-1 z-0"/>

                <div className="bg-white h-full rounded-lg shadow-2xl flex items-center flex-col">
                    <div className="z-[9999999] h-16 w-full flex items-center justify-center text-white rounded-lg shadow-lg" style={{
                        background: 'linear-gradient(90deg, rgba(81,112,218,1) 0%, rgba(42,63,134,1) 100%)',
                    }}>
                        blocksheep race - {formattedDate}
                    </div>
                    
                    <div className="shadow-xl bg-white w-[88%] p-2 my-3 rounded-xl overflow-y-auto h-full">
                        <div className="flex flex-row gap-1 text-sm text-[#647896] mb-1">
                            <div className="w-[55%] bg-[#e9f1f3] p-1 px-3 rounded-xl"># Player</div>
                            <div className="w-[45%] bg-[#e9f1f3] p-1 px-3 rounded-xl">Score</div>
                        </div>
                        {
                            stats && stats.map((i, key) => {
                                return (
                                    <div key={key} className="flex flex-col gap-2 text-sm text-[#647896] mb-1">
                                        <div className="flex flex-row gap-1 text-sm text-[#647896] ">
                                            <div className={`w-[55%] bg-[#e9f1f3] p-1 px-3 rounded-xl flex flex-row items-center justify-around`}>
                                                <div>{key + 1}</div>
                                                {
                                                    smartAccountAddress == i.address ? 
                                                    <img src={BlackSheepImage} alt="you" className="w-[16px] h-[16px]"/> 
                                                    :
                                                    <img src={WhiteSheepImage} alt="opponent" className="w-[14px] h-[16px]"/>
                                                }
                                                <div>
                                                    {users.find(j => j.address == i.address)?.name || "Unknown"}
                                                </div>
                                            </div>
                                            <div className="w-[45%] bg-[#e9f1f3] p-1 px-3 rounded-xl flex flex-row gap-4 items-center justify-around">
                                                {i.curr}
                                                {
                                                    scoreAboveAverage(i.curr) ? 
                                                    <img src={ArrowUpImage} alt="above-avg" className="w-4 h-4"/> :
                                                    <img src={ArrowDownImage} alt="below-avg" className="w-4 h-4"/>
                                                }
                                            </div>
                                        </div>

                                        {
                                            (key + 1 <= stats.length - 1) &&
                                            !scoreAboveAverage(stats[key + 1].curr) &&
                                            !belowAverageShown && // Check if the msg has been shown
                                            <div className="flex flex-row gap-2 items-center w-full">
                                                <div className="flex-1 bg-yellow-400 h-1"></div>
                                                <span className="flex-1 text-yellow-400 whitespace-nowrap text-center">Average</span>
                                                <div className="flex-1 bg-yellow-400 h-1"></div>
                                            </div>
                                        }

                                        {
                                            (key + 1 <= stats.length - 1) &&
                                            !scoreAboveAverage(stats[key + 1].curr) &&
                                            (belowAverageShown = true) // Set the flag to true after showing the msg
                                        }
                                    </div>
                                );
                            })
                        }
                    </div>
                </div>
            </div>

                         
            <div className="absolute top-3 right-3 w-14 rotate-90 bg-white rounded-full opacity-70">
                <img onClick={handleMoveToNext} src={ArrowUpImage} alt="go-next" className="opacity-70" />
            </div>
        </div>
    );
}