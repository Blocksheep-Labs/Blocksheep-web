import { usePrivy } from "@privy-io/react-auth";
import { useLocation, useNavigate, useParams } from "react-router-dom";


export default function StatsScreen() {
    const navigate = useNavigate();
    const {raceId} = useParams();
    const {user} = usePrivy();
    const location = useLocation();


    return (
        <div className="relative mx-auto flex h-dvh w-full flex-col bg-[#4c9230]">
            <div className="h-[60%] bg-stats_top_bg bg-cover bg-no-repeat">
                {
                    // TODO: SHEEPS HERE
                }
            </div>
            <div className="h-[40%] p-5">
                <div className="bg-[#e1dfe2] h-full">
                    <div className="w-full h-7 border-[1px] border-black flex flex-row">
                        <div className="w-[20%] border-r-[1px] border-black flex justify-center items-center">1</div>
                        <div className="w-[80%] flex justify-center items-center">0x00000000000000000000000</div>
                    </div>

                    <div className="w-full h-7 border-[1px] border-black flex flex-row bg-[#eec245]">
                        <div className="w-[20%] border-r-[1px] border-black flex justify-center items-center">2</div>
                        <div className="w-[80%] flex justify-center items-center">0x00000000000000000000000</div>
                    </div>
                </div>
            </div>
        </div>
    );
}