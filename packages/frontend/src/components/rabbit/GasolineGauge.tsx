import React from "react";

const GasolineGauge = () => {
  // You can adjust this value as needed
  const height = 50; // Example height

  return (
    <div className="panel">
      <div className="gasoline-gauge" style={{ height: `${height}px` }}></div>
      <img id="carrot_fuel" src="https://i.ibb.co/pzqvY2d/carrot-unfill.png" alt="Carrot Fuel" />
    </div>
  );
};

export default GasolineGauge;
