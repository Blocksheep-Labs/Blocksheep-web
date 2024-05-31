const FuelBar = ({ players }) => {
  // Find the maximum and minimum fuel levels for positioning
  const maxFuel = Math.max(...players.map((player) => player.Fuel))
  const minFuel = Math.min(...players.map((player) => player.Fuel))

  return (
    <div className="fuel-bar-container">
      <div className="fuel-line" /> {/* Horizontal line */}
      {players.map((player) => {
        // Calculate the left position as a percentage, considering the minimum fuel as the left margin
        const relativeFuel = player.Fuel - minFuel
        const fuelRange = maxFuel - minFuel
        const leftPosition = ((relativeFuel / fuelRange) * 100).toFixed(2) // Use toFixed(2) for precision

        return (
          <div
            key={player.id}
            className="fuel-circle"
            style={{ left: `calc(${leftPosition}% - 10px + 1%)`, backgroundColor: "blue" }} // Adjust for circle size and add left margin
            title={`Player ${player.id} Fuel: ${player.Fuel}`}
          />
        )
      })}
    </div>
  )
}

export default FuelBar
