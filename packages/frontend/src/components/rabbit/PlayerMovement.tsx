import React, { useEffect, useRef, useState } from "react";
import { ConnectedUser, RabbitHolePhases } from "../../screens/RabbitHole";

const PlayerMovement = ({ 
  phase, 
  players, 
  isRolling, 
}: {
  phase: RabbitHolePhases; 
  players: ConnectedUser[];
  isRolling: boolean;
}) => {
  const [prevStage, setPrevStage] = useState<RabbitHolePhases | undefined>(undefined);
  const [sortedPlayers, setSortedPlayers] = useState<ConnectedUser[]>([]);
  const [animationTrigger, setAnimationTrigger] = useState<boolean>(false);

  const playerRefs = useRef<(React.RefObject<HTMLImageElement>)[]>([]);
  const fuelRefs = useRef<(React.RefObject<HTMLParagraphElement>)[]>([]);

  // Sort players and update refs when players change
  useEffect(() => {
    const sorted = [...players].sort((a, b) => b.Fuel - a.Fuel);
    setSortedPlayers(sorted);
    
    playerRefs.current = players.map((_, i) => playerRefs.current[i] || React.createRef());
    fuelRefs.current = players.map((_, i) => fuelRefs.current[i] || React.createRef());
  }, [players]);

  // Handle animations when the phase changes or players change
  useEffect(() => {
    // Trigger animations only when necessary
    if (prevStage !== phase || animationTrigger) {
      sortedPlayers.forEach((player, index) => {
        const playerElement = playerRefs.current[index]?.current;
        const fuelElement = fuelRefs.current[index]?.current;
        if (!playerElement || !fuelElement) return;

        const positionStyle = `${28 * index}px`;

        // Set the initial position and visibility of elements
        playerElement.style.position = 'absolute';
        fuelElement.style.position = 'absolute';
        playerElement.style.visibility = 'visible';
        fuelElement.style.visibility = 'visible';
        
        setPrevStage(phase);
        setAnimationTrigger(false);

        // Animation logic for different phases
        if (['Reset', 'Default'].includes(phase)) {
          setTimeout(() => {
            playerElement.style.position = "absolute";
            playerElement.style.transition = 'all 1.5s ease-out';
            playerElement.style.left = '50%';
            playerElement.style.top = positionStyle;

            fuelElement.style.position = "absolute";
            fuelElement.style.transition = 'all 1.5s ease-out';
            fuelElement.style.left = '50%';
            fuelElement.style.top = positionStyle;
            fuelElement.style.opacity = '0';
          }, index * 300);
        } else if (phase === 'CloseTunnel') {
          setTimeout(() => {
            playerElement.style.transition = 'all 0s ease-out';
            playerElement.style.left = '50%';
            playerElement.style.transition = 'all 0.5s ease-out';
            playerElement.style.left = '-100%';

            fuelElement.style.transition = 'all 0s ease-out';
            fuelElement.style.left = '50%';
            fuelElement.style.transition = 'all 0.5s ease-out';
            fuelElement.style.left = '-100%';
            fuelElement.style.opacity = '0';
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
            fuelElement.style.opacity = '1';

            setTimeout(() => {
              const minFuel = sortedPlayers[sortedPlayers.length - 1].Fuel;
              const listOfMinFuelPlayers = sortedPlayers.filter(i => i.Fuel === minFuel);

              // if all the submitted fuel were similar
              if (listOfMinFuelPlayers.length === sortedPlayers.length) {
                return;
              }

              // remove all players with minimum fuel
              if (index >= sortedPlayers.length - listOfMinFuelPlayers.length) playerElement.style.top = '400px';
            }, 4000);
          }, 1000 + delay);
        }
      });
    }
  }, [phase, sortedPlayers, prevStage, animationTrigger, playerRefs, fuelRefs, isRolling, players]);

  // Handle phase changes to trigger animations
  useEffect(() => {
    if (prevStage !== phase) {
      setAnimationTrigger(true);
    }
  }, [phase, prevStage]);

  return (
    <div className="player-container">
      {sortedPlayers.map((player, index) => (
        <img
          key={player.id}
          ref={playerRefs.current[index]}
          src={player.src}
          alt={player.id.toString()}
          //style={{ position: 'absolute', transition: 'all 0.5s ease-out' }} // Set initial styles
        />
      ))}
      {sortedPlayers.map((player, index) => (
        <p
          key={player.id}
          ref={fuelRefs.current[index]}
          className="fuel-text text-[10px] text-white bg-black font-bold px-1 rounded-full"
          //style={{ position: 'absolute', transition: 'all 0.5s ease-out' }} // Set initial styles
        >
          {player.Fuel}
        </p>
      ))}
    </div>
  );
};

export default PlayerMovement;
