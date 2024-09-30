
import CarrotUnfillImage from "../../assets/rabbit-hole/carrot-unfill.png";

const GasolineGauge = (props: {
  fuel: number;
  maxFuel: number;
}) => {
  return (
    <div className="panel relative rotate-180">
      <div className="gasoline-gauge" style={{ height: `${props.fuel}px` }}></div>
      <img id="carrot_fuel" src={CarrotUnfillImage} alt="Carrot Fuel" className="rotate-180"/>
      <p className="font-bold text-[24px] absolute top-2 left-3 rotate-180 text-white">{props.maxFuel}</p>
    </div>
  );
};

export default GasolineGauge;
