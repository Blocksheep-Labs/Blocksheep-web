
import CarrotUnfillImage from "../../assets/rabbit-hole/carrot-unfill.png";

const GasolineGauge = (props: {
  fuel: number
}) => {
  return (
    <div className="panel relative rotate-180">
      <div className="gasoline-gauge" style={{ height: `${props.fuel}px` }}></div>
      <img id="carrot_fuel" src={CarrotUnfillImage} alt="Carrot Fuel" className="rotate-180"/>
    </div>
  );
};

export default GasolineGauge;
