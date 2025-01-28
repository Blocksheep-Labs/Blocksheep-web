import CarrotsBucketImage from "../../../assets/images/carrotbasket.png"

export default function RHRule4() {
    return (
        <div className="flex h-24 rounded-2xl border-[5px] shadow-xl">
            <div className="w-full bg-[#ece0c8] flex flex-row bg-opacity-90">
                <div className="w-[64%] text-lg flex items-center justify-center text-center p-2">
                    Don't run out of carrots
                </div>

                <div className="flex flex-col bg-black w-[36%] rounded-xl flex items-center justify-center">
                    <img src={CarrotsBucketImage} alt="slider" className="w-20"/>
                </div>
            </div>
        </div>
    );
}