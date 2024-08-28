import React, { useEffect, useRef } from "react";
import { ConnectedUser } from "../../screens/TunnelGame";


const PlayerMovement = ({ phase, players }: {phase: string; players: ConnectedUser[]}) => {
  // Sort players by PlayerPosition
  const sortedPlayers = [...players].sort((a, b) => a.PlayerPosition - b.PlayerPosition);

  const playerRefs = useRef([]);

  useEffect(() => {
    // Update refs when players change
    playerRefs.current = players.map((_, i) => playerRefs.current[i] || React.createRef());
  }, [players]);

  //console.log("PLAYERS:", players, phase)

  useEffect(() => {
    sortedPlayers.forEach((player, index) => {
      // @ts-ignore
      const playerElement = playerRefs.current[index].current;
      if (!playerElement) return;

      const positionStyle = `${20 * player.PlayerPosition}px`;

      if (phase === 'Default' || phase === 'Reset') {
        setTimeout(() => {
          playerElement.style.transition = 'all 1.5s ease-out';
          playerElement.style.left = '50%';
          playerElement.style.visibility = 'visible';
          playerElement.style.top = positionStyle;
        }, index * 300);
      } else if (phase === 'CloseTunnel') {
        playerElement.style.left = '80%';
        setTimeout(() => {
          playerElement.style.transition = 'all 0.5s ease-out';
          playerElement.style.left = '-100%';
        }, 3000);
      } else if (phase === 'OpenTunnel') {
        const delay = index * 1000;
        setTimeout(() => {
          playerElement.style.top = positionStyle;
          playerElement.style.left = '150vw';
          playerElement.style.transition = 'all 12s ease-out';
        }, 1000 + delay);

        setTimeout(() => {
          playerElement.style.visibility = 'hidden';
          playerElement.style.left = '-10vw';
          playerElement.style.transition = 'none';
        }, 9000 + delay);
      }
    });
  }, [phase, sortedPlayers]);

  return (
    <div className="player-container">
      {sortedPlayers.map((player, index) => (
        <img
          key={player.id}
          ref={playerRefs.current[index]}
          src={player.src}
          alt={player.id.toString()}
          className={`player-${index + 1}`}
        />
      ))}
    </div>
  );
};

export default PlayerMovement;
