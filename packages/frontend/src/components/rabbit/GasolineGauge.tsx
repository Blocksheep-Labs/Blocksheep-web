
import CarrotUnfillImage from "../../assets/rabbit-hole/carrot-unfill.png";

const GasolineGauge = (props: {
  fuel: number
}) => {
  // You can adjust this value as needed
  return (
    <div className="panel relative">
      <div className="gasoline-gauge" style={{ height: `${props.fuel}px` }}></div>
      <img id="carrot_fuel" src={CarrotUnfillImage} alt="Carrot Fuel" />
    </div>
  );
};

export default GasolineGauge;
