import React, { useEffect, useRef, useState } from "react";
import { ConnectedUser, RabbitHolePhases } from "../../screens/RabbitHole";


const PlayerMovement = ({ phase, players }: {phase: RabbitHolePhases; players: ConnectedUser[]}) => {
  const [prevStage, setPrevStage] = useState<undefined | string>(undefined);
  // Sort players by Fuel submitted
  const sortedPlayers = [...players].sort((a, b) => b.Fuel - a.Fuel);

  console.log("SORTED PLAYERS:", {sortedPlayers})

  const playerRefs = useRef([]);
  const fuelRefs = useRef([]);

  useEffect(() => {
    // Update refs when players change
    playerRefs.current = players.map((_, i) => playerRefs.current[i] || React.createRef());
    fuelRefs.current   = players.map((_, i) => fuelRefs.current[i]   || React.createRef());
  }, [players]);

  //console.log("PLAYERS:", {players, phase})

  useEffect(() => {
    console.log({prevStage, phase})
    if (prevStage !== phase) {
      console.log("REFRESHING POS...");
  
      sortedPlayers.forEach((player, index) => {
        // @ts-ignore
        const playerElement = playerRefs.current[index].current;
        // @ts-ignore
        const fuelElement = fuelRefs.current[index].current;
        if (!playerElement || !fuelElement) return;
        //if (!playerElement) return;
  
        setPrevStage(phase);
        const positionStyle = `${28 * index}px`;
        console.log(positionStyle);
        if (['Reset', 'Default'].includes(phase)) {
          setTimeout(() => {
            playerElement.style.transition = 'all 1.5s ease-out';
            playerElement.style.left = '50%';
            playerElement.style.visibility = 'visible';
            playerElement.style.top = positionStyle;

            fuelElement.style.transition = 'all 1.5s ease-out';
            fuelElement.style.left = '50%';
            fuelElement.style.visibility = 'visible';
            fuelElement.style.top = positionStyle;
            fuelElement.style.opacity = 0;
          }, index * 300);
        } else if (phase === 'CloseTunnel') {
          //playerElement.style.left = '80%';
          //fuelElement.style.left = '80%';
          setTimeout(() => {
            playerElement.style.transition = 'all 0.5s ease-out';
            playerElement.style.left = '-100%';

            fuelElement.style.transition = 'all 0.5s ease-out';
            fuelElement.style.left = '-100%';
            fuelElement.style.opacity = 0;
          }, 3000);
        } else if (phase === 'OpenTunnel') {
          const delay = index * 1000;
          setTimeout(() => {
            playerElement.style.top = positionStyle;
            playerElement.style.left = '150vw';
            playerElement.style.transition = 'all 12s ease-out';

            fuelElement.style.top = positionStyle;
            fuelElement.style.left = '150vw';
            fuelElement.style.transition = 'all 12s ease-out';
            fuelElement.style.opacity = 1;

            setTimeout(() => {
              if (index === sortedPlayers.length - 1)
              playerElement.style.top = '400px';
            }, 4000);
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
  }, [phase, sortedPlayers, prevStage, playerRefs, fuelRefs]);

  return (
    <div className="player-container">
      {sortedPlayers.map((player, index) => ( 
        <img
          key={player.id}
          ref={playerRefs.current[index]}
          src={player.src}
          alt={player.id.toString()}
        />
      ))}
      {sortedPlayers.map((player, index) => (
        <p
          key={player.id}
          ref={fuelRefs.current[index]}
          className="fuel-text text-[10px] text-white bg-black font-bold px-1 rounded-full"
        >
          {player.Fuel}
        </p>
      ))}
    </div>
  );
};

export default PlayerMovement;
