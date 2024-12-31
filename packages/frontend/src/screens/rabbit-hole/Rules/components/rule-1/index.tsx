import SliderImage from "../../../assets/images/sliderscreenshot.png";

export default function RHRule1() {
    return (
        <div className="flex h-32 rounded-2xl border-[5px]">
            <div className="w-full bg-[#ece0c8] flex flex-row bg-opacity-90">
                <div className="flex flex-col bg-black w-[48%] rounded-xl flex items-center justify-center">
                    <img src={SliderImage} alt="slider" className="w-28"/>
                    <p className="text-white px-2 text-sm">Slide left-rignt</p>
                </div>

                <div className="w-[52%] text-lg flex items-center justify-center text-center p-2">
                    Drop rabbit's carrots to run away
                </div>
            </div>
        </div>
    );
}