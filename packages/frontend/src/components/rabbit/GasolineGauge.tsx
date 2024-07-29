
const GasolineGauge = (props: {
  fuel: number
}) => {
  // You can adjust this value as needed
  return (
    <div className="panel relative">
      <div className="gasoline-gauge" style={{ height: `${props.fuel}px` }}></div>
      <img id="carrot_fuel" src="https://i.ibb.co/pzqvY2d/carrot-unfill.png" alt="Carrot Fuel" />
    </div>
  );
};

export default GasolineGauge;
