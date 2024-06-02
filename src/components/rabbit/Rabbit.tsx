import React, { useState, useEffect, useRef } from "react";

const Lever = () => {
  const [currentAngle, setCurrentAngle] = useState(0);
  const [displayNumber, setDisplayNumber] = useState(1); // Start with a default of 1
  const sensitivity = 2; // Increase sensitivity for more responsiveness

  useEffect(() => {
    const lever = document.getElementById("lever");

    const getAngleRelativeToCenter = (x, y) => {
      const rect = lever.getBoundingClientRect();
      const center_x = rect.left + rect.width / 2;
      const center_y = rect.bottom - rect.height / 2;
      return Math.atan2(y - center_y, x - center_x) * (180 / Math.PI);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      const touchAngle = getAngleRelativeToCenter(touch.clientX, touch.clientY);
      let angleDifference = touchAngle * sensitivity;

      // Constrain the angle between 0 and 180
      angleDifference = Math.max(0, Math.min(angleDifference, 180));
      setCurrentAngle(angleDifference);
      // Calculate displayNumber, ensuring it's never less than 1
      setDisplayNumber(Math.max(1, Math.round((angleDifference / 180) * 9)));
    };

    const touchEnd = () => {
      setCurrentAngle(0); // Reset lever angle but keep number displayed
    };

    lever.addEventListener("touchmove", handleTouchMove);
    lever.addEventListener("touchend", touchEnd);

    return () => {
      lever.removeEventListener("touchmove", handleTouchMove);
      lever.removeEventListener("touchend", touchEnd);
    };
  }, []);

  return (
    <>
      <div className="panel">
        <div className="number-display">{displayNumber}</div>
      </div>

      <div className="lever-container">
        <img
          src="https://i.ibb.co/fXQVWpW/Lever-handle.png"
          alt="Rotating Lever"
          id="lever"
          style={{
            transform: `rotate(${currentAngle}deg)`,
            transition: "transform 0.5s ease-out",
            height: "100px",
            position: "relative",
            top: "-50px",
            transformOrigin: "50% 100%", // for rotation around the bottom center
          }}
        />
      </div>
    </>
  );
};

const GasolineGauge = () => {
  // You can adjust this value as needed
  const height = 50; // Example height

  return (
    <div className="panel">
      <div className="gasoline-gauge" style={{ "--gauge-height": `${height}px` }}></div>
      <img id="carrot_fuel" src="https://i.ibb.co/pzqvY2d/carrot-unfill.png" />
    </div>
  );
};

function RabbitHead({ phase }) {
  useEffect(() => {
    const head = document.querySelector(".rabbit-head");
    if (phase === "CloseTunnel") {
      head.style.transform = "translateX(-130vw)";
    } else if (phase === "OpenTunnel") {
      // it goes back in position
      head.style.visibility = "hidden";
      head.style.transform = "translateX(50vw)";
    } else if (phase === "Reset") {
      head.style.visibility = "visible";
      head.style.transform = "translateX(0)";
    }
  }, [phase]);

  return (
    <img className="rabbit-head" src="https://i.ibb.co/pvJj4gh/rabbit.png" alt="Rabbit Head" />
  );
}

function Darkness({ phase }) {
  useEffect(() => {
    const darkness = document.querySelector(".darkness");
    if (phase === "CloseTunnel") {
      darkness.style.visibility = "visible";
      darkness.style.left = "-10%"; // Cover the screen
    } else if (phase === "OpenTunnel") {
      darkness.style.left = "-110%"; // Move off-screen to the left
    } else if (phase === "Reset") {
      darkness.style.visibility = "hidden";
      darkness.style.left = "100%";
    }
  }, [phase]);

  return <div className="darkness"></div>;
}

function RabbitTail({ phase }) {
  useEffect(() => {
    const tail = document.querySelector(".rabbit-tail");
    if (phase === "OpenTunnel") {
      tail.style.visibility = "visible";
      tail.style.transform = "translateX(-100vw)";
      setTimeout(() => {
        tail.style.transform = "translateX(-100vw) rotate(-25deg) translateY(-20px)";
      }, 1500);

      setTimeout(() => {
        tail.style.transform = "translateX(-150vw)";
      }, 5000);
    } else if (phase === "Reset") {
      tail.style.visibility = "hidden";
      tail.style.transform = "translateX(0) rotate(0) translateY(0)";
    }
  }, [phase]);

  return (
    <img className="rabbit-tail" src="https://i.ibb.co/3FG2ch1/flufflytail.png" alt="Rabbit Tail" />
  );
}

const PlayerMovement = ({ phase, players }) => {
  // Sort players by PlayerPosition
  const sortedPlayers = [...players].sort((a, b) => a.PlayerPosition - b.PlayerPosition);
  const playerRefs = useRef(sortedPlayers.map(() => React.createRef()));

  useEffect(() => {
    sortedPlayers.forEach((player, index) => {
      const playerElement = playerRefs.current[index].current;
      if (!playerElement) return;

      const positionStyle = `${20 * player.PlayerPosition}px`;

      if (phase === "Default" || phase === "Reset") {
        setTimeout(() => {
          playerElement.style.transition = "all 1.5s ease-out";
          playerElement.style.left = "50%";
          playerElement.style.visibility = "visible";
          playerElement.style.top = positionStyle;
        }, index * 300);
      } else if (phase === "CloseTunnel") {
        playerElement.style.left = "80%";
        setTimeout(() => {
          playerElement.style.transition = "all 0.5s ease-out";
          playerElement.style.left = "-100%";
        }, 3000);
      } else if (phase === "OpenTunnel") {
        const delay = index * 1000;
        setTimeout(() => {
          playerElement.style.top = positionStyle;
          playerElement.style.left = "150vw";
          playerElement.style.transition = "all 12s ease-out";
        }, 1000 + delay);

        setTimeout(() => {
          playerElement.style.visibility = "hidden";
          playerElement.style.left = "-10vw";
          playerElement.style.transition = "none";
        }, 9000 + delay);
      }
    });
  }, [phase]);

  return (
    <div className="player-container">
      {sortedPlayers.map((player, index) => (
        <img
          key={player.id}
          ref={playerRefs.current[index]}
          src={player.src}
          alt={player.id}
          className={`player-${player.id}`}
        />
      ))}
    </div>
  );
};

const FuelBar = ({ players }) => {
  // Find the maximum and minimum fuel levels for positioning
  const maxFuel = Math.max(...players.map((player) => player.Fuel));
  const minFuel = Math.min(...players.map((player) => player.Fuel));

  return (
    <div className="fuel-bar-container">
      <div className="fuel-line"></div> {/* Horizontal line */}
      {players.map((player) => {
        // Calculate the left position as a percentage, considering the minimum fuel as the left margin
        const relativeFuel = player.Fuel - minFuel;
        const fuelRange = maxFuel - minFuel;
        const leftPosition = ((relativeFuel / fuelRange) * 100).toFixed(2); // Use toFixed(2) for precision

        return (
          <div
            key={player.id}
            className="fuel-circle"
            style={{ left: `calc(${leftPosition}% - 10px + 1%)`, backgroundColor: "blue" }} // Adjust for circle size and add left margin
            title={`Player ${player.id} Fuel: ${player.Fuel}`}
          ></div>
        );
      })}
    </div>
  );
};

function TunnelChange(setPhase) {
  setPhase("CloseTunnel"); // Close tunnel: Head moves to swallow everything. Open tunnel: cars get out
  setTimeout(() => setPhase("OpenTunnel"), 5000);
  setTimeout(() => setPhase("Reset"), 16000);
}

function App() {
  const [phase, setPhase] = React.useState("Default");
  const [players, setPlayers] = useState([
    { id: "player1", src: "https://i.ibb.co/SN7JyMF/sheeepy.png", PlayerPosition: 2, Fuel: 80 },
    { id: "player2", src: "https://i.ibb.co/vXGDsDD/blacksheep.png", PlayerPosition: 1, Fuel: 30 },
    { id: "player3", src: "https://i.ibb.co/SN7JyMF/sheeepy.png", PlayerPosition: 3, Fuel: 20 },
  ]);

  return (
    <div className="app-container">
      <FuelBar players={players} />
      <div className="tunnel">
        <PlayerMovement phase={phase} players={players} />
        <Darkness phase={phase} />
        <RabbitHead phase={phase} />
        <RabbitTail phase={phase} />
      </div>
      <button id="StartTunnel" onClick={() => TunnelChange(setPhase)}>
        Start
      </button>

      <div className="control-panels">
        <Lever />

        <GasolineGauge />
      </div>
    </div>
  );
}
