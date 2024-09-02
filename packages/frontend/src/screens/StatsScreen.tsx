import { usePrivy } from "@privy-io/react-auth";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {useEffect, useState} from "react";
import {getRaceById} from "../utils/contract-functions";
import {useSmartAccount} from "../hooks/smartAccountProvider";
import shortenAddress from "../utils/shortenAddress";


export default function StatsScreen() {
    const navigate = useNavigate();
    const {raceId} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const location = useLocation();
    const [stats, setStats] = useState<{curr: number; address: string}[] | undefined>(undefined);

    useEffect(() => {
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
            <div className="h-[60%] bg-stats_top_bg bg-cover bg-no-repeat">
                {
                    // TODO: SHEEPS HERE
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
                                        className="w-[80%] flex justify-center items-center">{shortenAddress(i.address)}
                                    </div>
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
    );
}