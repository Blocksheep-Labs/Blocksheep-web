import { useState } from "react";
import RibbonLabel from "../components/RibbonLabel";
import { useNavigate, useParams } from "react-router-dom";

const Rating = ({
    handleChange,
    amount
}: {
    handleChange: (value: number) => void;
    amount: number;
}) => {
    return (
        <div className="flex items-center">
            <svg onClick={() => handleChange(1)} className={`w-8 h-8 ms-3 ${amount >= 1 ? 'text-yellow-300' : 'text-gray-300'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
            </svg>
            <svg onClick={() => handleChange(2)} className={`w-8 h-8 ms-3 ${amount >= 2 ? 'text-yellow-300' : 'text-gray-300'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
            </svg>
            <svg onClick={() => handleChange(3)} className={`w-8 h-8 ms-3 ${amount >= 3 ? 'text-yellow-300' : 'text-gray-300'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
            </svg>
            <svg onClick={() => handleChange(4)} className={`w-8 h-8 ms-3 ${amount >= 4 ? 'text-yellow-300' : 'text-gray-300'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
            </svg>
            <svg onClick={() => handleChange(5)} className={`w-8 h-8 ms-3 ${amount >= 5 ? 'text-yellow-300' : 'text-gray-300'}`} aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 22 20">
                <path d="M20.924 7.625a1.523 1.523 0 0 0-1.238-1.044l-5.051-.734-2.259-4.577a1.534 1.534 0 0 0-2.752 0L7.365 5.847l-5.051.734A1.535 1.535 0 0 0 1.463 9.2l3.656 3.563-.863 5.031a1.532 1.532 0 0 0 2.226 1.616L11 17.033l4.518 2.375a1.534 1.534 0 0 0 2.226-1.617l-.863-5.03L20.537 9.2a1.523 1.523 0 0 0 .387-1.575Z"/>
            </svg>
        </div>
    );
}

export default function RateScreen() {
    const [underdogRate, setUnderdogRate] = useState(3);
    const [rabbitHoleRate, setRabbitHoleRate] = useState(3);
    const [bullRunRate, setBullruneRate] = useState(3);
    const navigate = useNavigate();
    const {raceId} = useParams();


    const handleNavigate = () => {
        // TODO: probably save rates somewhere...
        navigate(`/race/${raceId}/stats`);
    }

    return (
        <div className="relative mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom items-center">
            <div className="mt-7 flex w-full justify-center">
                <RibbonLabel text="RATE THE FUN" smallerText/>
            </div>

            <div className="flex flex-col gap-3 mt-5">
                <div className="w-full flex flex-col justify-center items-center">
                    <p className="text-2xl">UNDERDOG</p>
                    <Rating handleChange={(value: number) => setUnderdogRate(value)} amount={underdogRate}/>
                </div>

                <div className="w-full flex flex-col justify-center items-center">
                    <p className="text-2xl">RABBIT HOLE</p>
                    <Rating handleChange={(value: number) => setRabbitHoleRate(value)} amount={rabbitHoleRate}/>
                </div>

                <div className="w-full flex flex-col justify-center items-center">
                    <p className="text-2xl">BULL RUN</p>
                    <Rating handleChange={(value: number) => setBullruneRate(value)} amount={bullRunRate}/>
                </div>
            </div>

            <button 
                onClick={handleNavigate}
                className="absolute bottom-20 px-7 py-4 bg-[#eec245] w-28 border-[1px] border-black rounded-xl text-2xl"
            >
                NEXT
            </button>
        </div>
    );
}