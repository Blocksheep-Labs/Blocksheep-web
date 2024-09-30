import { usePrivy } from "@privy-io/react-auth";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {useEffect, useState} from "react";
import {getRaceById} from "../../utils/contract-functions";
import {useSmartAccount} from "../../hooks/smartAccountProvider";
import shortenAddress from "../../utils/shortenAddress";
import StatsImage from "../../assets/stats/podium.png";
import WhiteSheepImage from "../../assets/rabbit-hole/sheeepy.png";
import BlackSheepImage from "../../assets/rabbit-hole/blacksheep.png";
import NextFlag from "../../assets/common/flag.png";
import { socket } from "../../utils/socketio";

export default function StatsScreen() {
    const navigate = useNavigate();
    const {raceId} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const location = useLocation();
    const [stats, setStats] = useState<{curr: number; address: string}[] | undefined>(undefined);
    
    const date = new Date();

    useEffect(() => {
        socket.disconnect();
        if (raceId?.length && smartAccountAddress) {
            getRaceById(Number(raceId), smartAccountAddress as `0x${string}`).then(data => {
                if (data) {
                    console.log(data)
                    // VALIDATE USER FOR BEING REGISTERED
                    if (!data.registeredUsers.includes(smartAccountAddress)) {
                        //console.log("USER IS NOT LOGGED IN !!!!!!!!!!!!!!", data.registeredUsers, smartAccountAddress)
                        navigate('/');
                    }

                    let newProgress: { curr: number; address: string }[] = data.progress.map(i => {
                        return { curr: Number(i.progress), address: i.user };
                    });

                    setStats(newProgress.toSorted((a, b) => b.curr - a.curr));

                    console.log("PROGRESS:", newProgress);
                }
            });
        }
    }, [raceId, smartAccountAddress]);

    return (
        <div className="relative mx-auto flex h-dvh w-full flex-col bg-[#4c9230]">
            <div className="h-[60%] w-full flex justify-center relative">
                <img src={StatsImage} alt="stats image"/>

                { 
                    // LEFT
                }
                <img src={`${stats && (smartAccountAddress === stats[1]?.address) ? BlackSheepImage : WhiteSheepImage}`} alt="left" className="absolute w-10 left-[88px] top-[56.5%]"/>
                { 
                    // CENTER
                }
                <img src={`${stats && (smartAccountAddress === stats[0]?.address) ? BlackSheepImage : WhiteSheepImage}`} alt="center" className="absolute w-10 top-[48%]"/>
                { 
                    // RIGHT
                }
                <img src={`${stats && (smartAccountAddress === stats[2]?.address) ? BlackSheepImage : WhiteSheepImage}`} alt="right" className="absolute w-10 right-[88px] top-[56.5%]"/>

                <p className="text-white font-bold text-center absolute top-[40%] w-full">
                    {
                        date.toLocaleDateString("en-GB", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                        })
                    }
                </p>
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
                                        className="w-[80%] flex justify-center items-center">{shortenAddress(i.address)}
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
                onClick={() => navigate('/select')}
                >
                Home
                </button>
                <img src={NextFlag} alt="next-flag" />
            </div>
        </div>
    );
}