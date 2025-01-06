import { useLocation, useNavigate, useParams } from "react-router-dom";
import {useEffect, useState} from "react";
import {getRaceById} from "../../../utils/contract-functions";
import {useSmartAccount} from "../../../hooks/smartAccountProvider";
import shortenAddress from "../../../utils/shortenAddress";
import StatsImage from "./assets/images/podium.png";
import WhiteSheepImage from "./assets/images/sheeepy.png";
import BlackSheepImage from "./assets/images/blacksheep.png";
import NextFlag from "../../../assets/common/flag.png";
import { httpGetRaceDataById } from "../../../utils/http-requests";
import PodiumBGImage from "./assets/images/podiumbg.png";

export default function StatsScreen() {
    const navigate = useNavigate();
    const {raceId} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const [stats, setStats] = useState<{curr: number; address: string}[] | undefined>(undefined);
    const [users, setUsers] = useState<any[]>([]);
    
    const date = new Date();

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




    return (
        <div className={`relative mx-auto flex w-full flex-col bg-center bg-top`} style={{ height: `${window.innerHeight}px`, backgroundImage: `url(${PodiumBGImage})` }}>
            <div className="h-[60%] w-full flex justify-center relative">



                {
                    users && users.length >= 2 &&
                    <div className="absolute w-16 left-[75px] top-[250px] flex items-center justify-center flex-col" style={{ transform: 'translate(-50%, -50%)' }}>
                        { 
                            // LEFT
                        }
                        <p className="bg-black font-bold text-white text-[10px] p-1 rounded-xl z-10 text-center">
                            {stats && users && (users.find(j => j.address == stats[1]?.address)?.name || "Unknown")} 
                        </p>
                        <img src={`${stats && (smartAccountAddress === stats[1]?.address) ? BlackSheepImage : WhiteSheepImage}`} className="h-16" alt="left"/>
                    </div>
                }
                
                {
                    users && users.length >= 1 &&
                    <div className="absolute w-24 top-[200px] left-[50%] flex items-center justify-center flex-col" style={{ transform: 'translate(-50%, -50%)' }}>
                        { 
                            // CENTER
                        }
                        <p className="bg-black font-bold text-white text-[14px] p-1 rounded-xl z-10 text-center w-fit">
                            {stats && users && users.find(j => j.address == stats[0]?.address)?.name} 
                        </p>
                        <img src={`${stats && (smartAccountAddress === stats[0]?.address) ? BlackSheepImage : WhiteSheepImage}`} className="h-24" alt="center"/>
                    </div>
                }

                {
                    users && users.length >= 3 &&
                    <div className="absolute w-12 right-[55px] top-[225px] flex items-center justify-center flex-col">
                        { 
                            // RIGHT
                        }
                        <p className="bg-black text-center font-bold text-white text-[8px] p-1 rounded-xl z-10">
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
            <div className="h-[40%] p-5">
                <div className="bg-[#e1dfe2] h-full">
                    {
                        stats && stats.map((i, key) => {
                            return (
                                <div key={key} className={`w-full h-7 border-[1px] border-black flex flex-row ${smartAccountAddress == i.address && 'bg-[#eec245]'}`}>
                                    <div
                                        className="w-[20%] border-r-[1px] border-black flex justify-center items-center">{i.curr}
                                    </div>
                                    <div
                                        className="w-[80%] flex justify-center items-center">{users.find(j => j.address == i.address)?.name} ({shortenAddress(i.address)})
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            </div>

            <div className="absolute bottom-0 right-0 w-[40%]">
                <button
                className="absolute mt-[5%] w-full -rotate-12 text-center font-[Berlin-Bold] text-[36px] text-[#18243F] hover:text-white"
                onClick={() => navigate('/select', { replace: true })}
                >
                    Next
                </button>
                <img src={NextFlag} alt="next-flag" />
            </div>
        </div>
    );
}