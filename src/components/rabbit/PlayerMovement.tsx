import React, { useEffect, useRef } from "react";

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

export default PlayerMovement;
