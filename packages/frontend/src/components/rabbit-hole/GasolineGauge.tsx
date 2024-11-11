
import CarrotUnfillImage from "../../assets/rabbit-hole/carrot-unfill.png";

const GasolineGauge = (props: {
  fuel: number;
  version: string;
}) => {
  const maxHeight = 88;
  const scalingFactor = maxHeight / (props.version == "v1" ? 10 : 20);
  const fuelHeight = props.fuel * scalingFactor;

  console.log({maxHeight, scalingFactor, fuelHeight});

  return (
    <div className="panel relative rotate-180">
      <div className="gasoline-gauge" style={{ height: `${fuelHeight}px` }}></div>
      <img id="carrot_fuel" src={CarrotUnfillImage} alt="Carrot Fuel" className="rotate-180"/>
      <p className="font-bold text-[24px] absolute top-2 left-3 rotate-180 text-white">{props.fuel}</p>
    </div>
  );
};

export default GasolineGauge;
