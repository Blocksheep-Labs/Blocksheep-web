import BasketCarrotImage from "../../../assets/images/basketcarrot.png";

export default function CarrotBasket({fuelLeft}: {
    fuelLeft: number
}) {
    return (
        <div className="relative">
            <img src={BasketCarrotImage} alt="basket" className="w-16"/>
            <span className="text-white absolute left-1/2 -bottom-[2px]" style={{ transform: 'translate(-50%,-50%)' }}>{fuelLeft}</span>
        </div>
    );
}