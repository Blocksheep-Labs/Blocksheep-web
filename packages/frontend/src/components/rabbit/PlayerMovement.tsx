import React, { useEffect, useRef, useState } from "react";
import { ConnectedUser, RabbitHolePhases } from "../../screens/RabbitHole";


const PlayerMovement = ({ phase, players }: {phase: RabbitHolePhases; players: ConnectedUser[]}) => {
  const [prevStage, setPrevStage] = useState<undefined | string>(undefined);
  // Sort players by PlayerPosition
  const sortedPlayers = [...players].sort((a, b) => a.PlayerPosition - b.PlayerPosition);

  const playerRefs = useRef([]);

  useEffect(() => {
    // Update refs when players change
    playerRefs.current = players.map((_, i) => playerRefs.current[i] || React.createRef());
  }, [players]);

  //console.log("PLAYERS:", {players, phase})

  useEffect(() => {
    console.log({prevStage, phase})
    if (prevStage !== phase) {
      console.log("REFRESHING POS...");
  
      sortedPlayers.forEach((player, index) => {
        // @ts-ignore
        const playerElement = playerRefs.current[index].current;
        if (!playerElement) return;
  
        setPrevStage(phase);
        const positionStyle = `${28 * index}px`;
        console.log(positionStyle);
        if (['Reset', 'Default'].includes(phase)) {
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
          
          /*
          setTimeout(() => {
            console.log("TIMEOUT!!!!!!!!!")
            playerElement.style.visibility = 'hidden';
            playerElement.style.left = '-10vw';
            playerElement.style.transition = 'none';
          }, 9000 + delay);
          */
        }
      });
    }
  }, [phase, sortedPlayers, prevStage]);

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
