import React, { useEffect, useRef } from "react";
import { ConnectedUser } from "../../screens/TunnelGame";

const PlayerMovement = ({ phase, players }: {phase: string; players: ConnectedUser[]}) => {
  const playerRefs = useRef([]);

  useEffect(() => {
    // Update refs when players change
    playerRefs.current = players.map((_, i) => playerRefs.current[i] || React.createRef());
  }, [players]);

  useEffect(() => {
    // Animation logic
    if (playerRefs.current.length) {
      const sortedPlayers = [...players].sort((a, b) => a.PlayerPosition - b.PlayerPosition);

      sortedPlayers.forEach((player, index) => {
        // @ts-ignore
        const playerElement = playerRefs.current[index].current;
        if (!playerElement) return;

        const positionStyle = `${20 * player.PlayerPosition}px`;

        switch (phase) {
          case "Default":
          case "Reset":
            setTimeout(() => {
              playerElement.style.transition = "all 1.5s ease-out";
              playerElement.style.left = "50%";
              playerElement.style.visibility = "visible";
              playerElement.style.top = positionStyle;
            }, index * 300);
            break;
          case "CloseTunnel":
            playerElement.style.left = "80%";
            setTimeout(() => {
              playerElement.style.transition = "all 0.5s ease-out";
              playerElement.style.left = "-100%";
            }, 3000);
            break;
          case "OpenTunnel":
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
            break;
          default:
            break;
        }
      });
    }
  }, [phase, players]);

  return (
    <div className="player-container">
      {players.map((player, index) => (
        <img
          key={player.id}
          ref={playerRefs.current[index]}
          src={player.src}
          alt={String(player.id)}
          className={`player-${player.id}`}
        />
      ))}
    </div>
  );
};

export default PlayerMovement;
