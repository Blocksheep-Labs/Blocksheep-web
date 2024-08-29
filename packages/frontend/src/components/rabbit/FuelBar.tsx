// @ts-nocheck
// @ts-ignore
import React from "react";
import { ConnectedUser } from "../../screens/RabbitHole";

const FuelBar = ({ players }: {players: ConnectedUser[]}) => {
  // Find the maximum and minimum fuel levels for positioning
  const maxFuel = Math.max(...players.map((player) => player.Fuel));
  const minFuel = Math.min(...players.map((player) => player.Fuel));

  return (
    <div
      className="fuel-bar-container"
      style={{ position: "relative", width: "100%", height: "50px" }}
    >
      <div
        className="fuel-line"
        style={{
          position: "absolute",
          width: "100%",
          height: "2px",
          background: "black",
          top: "50%",
        }}
      ></div>{" "}
      {/* Horizontal line */}
      {players.map((player: ConnectedUser) => {
        // Calculate the left position as a percentage, considering the minimum fuel as the left margin
        const relativeFuel = player.Fuel - minFuel;
        const fuelRange = maxFuel - minFuel;
        const leftPosition = fuelRange === 0 ? 50 : ((relativeFuel / fuelRange) * 100).toFixed(2); // Use toFixed(2) for precision

        return (
          <div
            key={player.address}
            className="fuel-circle"
            style={{
              position: "absolute",
              left: `calc(${leftPosition}% - 10px)`, // Adjust for circle size
              top: "50%",
              width: "20px",
              height: "20px",
              backgroundColor: "blue",
              borderRadius: "50%",
              transform: "translateY(-50%)",
            }}
            title={`Player ${player.id} Fuel: ${player.Fuel}`}
          ></div>
        );
      })}
    </div>
  );
};

export default FuelBar;
