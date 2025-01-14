import React, { useEffect, useRef, useState } from "react";
import { ConnectedUser, RabbitHolePhases } from "..";
import calculatePlayersV1 from "../calculations/v1";
import calculatePlayersV2 from "../calculations/v2";


const PlayerMovement = ({ 
  phase, 
  players, 
  isRolling, 
  amountOfComplteted,
  version
}: {
  phase: RabbitHolePhases; 
  players: ConnectedUser[];
  isRolling: boolean;
  amountOfComplteted: number;
  version: string;
}) => {
  const [prevStage, setPrevStage] = useState<RabbitHolePhases | undefined>(undefined);
  const [sortedPlayers, setSortedPlayers] = useState<ConnectedUser[]>([]);
  const [animationTrigger, setAnimationTrigger] = useState<boolean>(false);

  const playerRefs = useRef<(React.RefObject<HTMLImageElement>)[]>([]);
  const fuelRefs = useRef<(React.RefObject<HTMLParagraphElement>)[]>([]);

  // Sort players and update refs when players change
  useEffect(() => {
      // Check if the phase is not 'Default' before sorting
      if (phase !== 'Default') {
        const sorted = [...players].sort((a, b) => b.Fuel - a.Fuel);
        setSortedPlayers(sorted);
      } else {
        setSortedPlayers(players); // Keep the original order if phase is 'Default'
      }
      
      playerRefs.current = players.map((_, i) => playerRefs.current[i] || React.createRef());
      fuelRefs.current = players.map((_, i) => fuelRefs.current[i] || React.createRef());
  }, [players, players.length, phase]);

  
  useEffect(() => {
    //if (animationTrigger) {
      sortedPlayers.forEach((player, index) => {
        const playerElement = playerRefs.current[index]?.current;
        const fuelElement = fuelRefs.current[index]?.current;
        if (!playerElement || !fuelElement) return;
  
        const column = Math.floor(index / 3);  
        const row = index % 3;                 

        const topPosition = `${28 * row}px`;  
        const leftPosition = `${(50 - (12 * column))}%`;
        
        // Set initial position and visibility
        playerElement.style.position = 'absolute';
        playerElement.style.transition = 'all 1.5s ease-out';
        playerElement.style.visibility = 'visible';
        
        fuelElement.style.position = 'absolute';
        fuelElement.style.transition = 'all 1.5s ease-out';
        fuelElement.style.visibility = 'visible';
        
        setPrevStage(phase);
        setAnimationTrigger(false);
        
        // Animation logic for different phases
        if (phase === 'Default') {
          setTimeout(() => {            
            //console.log("DEFAULT")
            if (!player.isCompleted && !player.isEliminated) {
              playerElement.style.transition = 'all 1.5s ease-out';
              playerElement.style.left = leftPosition;
              playerElement.style.top = topPosition;
    
              fuelElement.style.transition = 'all 1.5s ease-out';
              fuelElement.style.left = leftPosition;
              fuelElement.style.top = topPosition;
              fuelElement.style.opacity = '0';
            }
          }, index * 300);
        } else if (phase === 'CloseTunnel') {
          setTimeout(() => {
            //console.log("CLOSE")
            playerElement.style.transition = 'all 0s ease-out';
            playerElement.style.left = leftPosition;
            playerElement.style.transition = 'all 0.5s ease-out';
            playerElement.style.left = '-50%';
  
            fuelElement.style.transition = 'all 0s ease-out';
            fuelElement.style.left = leftPosition;
            fuelElement.style.transition = 'all 0.5s ease-out';
            fuelElement.style.left = '-50%';
            fuelElement.style.opacity = '0';
          }, 1500);
        } else if (phase === 'Reset') {
          const delay = index * 500;
          setTimeout(() => {
            //console.log("RESET")
            playerElement.style.top = topPosition;
            playerElement.style.left = leftPosition;
            playerElement.style.transition = 'all 3s ease-out';
            
            fuelElement.style.top = topPosition;
            fuelElement.style.left = leftPosition;
            fuelElement.style.transition = 'all 3s ease-out';
            
            if (!player.isCompleted && !player.isEliminated) {
              playerElement.style.opacity = '1';
              fuelElement.style.opacity = '1';
            }
  
            setTimeout(() => {
              // Get players who are not eliminated
              const activePlayers = sortedPlayers.filter(i => !i.isCompleted && !i.isEliminated);

              // Ensure there are active players before proceeding
              if (activePlayers.length > 0) {
                // Get minimal fuel in the list
                const minFuel = Math.min(...activePlayers.map(player => player.Fuel));

                // Count players with the minimum fuel
                const listOfMinFuelPlayers = activePlayers.filter(i => i.Fuel === minFuel);

                // Only eliminate one player
                if (listOfMinFuelPlayers.length > 0) {
                  const playerToEliminate = listOfMinFuelPlayers[0]; // Get the first player with minimum fuel
                  // Apply elimination logic
                  if (playerElement && fuelElement && playerToEliminate.address === player.address) {
                    console.log("TO ELIMINATE:", player.address, playerToEliminate.address);
                    playerElement.style.transition = 'all 1.5s ease-out';
                    fuelElement.style.transition = 'all 1.5s ease-out';

                    fuelElement.style.top = '600px';
                    fuelElement.style.opacity = "0";

                    playerElement.style.top = '600px';
                    playerElement.style.opacity = "0";
                  }
                }
              }

            }, 1500);
          }, 1000 + delay);
        }
      });
    //}
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
        <div ref={playerRefs.current[index]} key={player.id} style={{ opacity: player.isEliminated ? 0 : 1 }} className="relative">
            <img
              className="absolute"
              src={player.src}
              alt={player.id.toString()}
            />
            <p className="absolute top-[-20px] text-[10px] text-white bg-black px-1 rounded-full w-fit" style={{ opacity: phase == "CloseTunnel" ? 0 : 1 }}>
              {player.name}
            </p>
            
        </div>
      ))}
      {sortedPlayers.map((player, index) => (
        <p
          key={player.id}
          ref={fuelRefs.current[index]}
          className="fuel-text absolute text-[10px] text-white bg-black px-1 rounded-full w-fit"
          style={{ opacity: player.isEliminated ? 0 : 1 }}
          //style={{ position: 'absolute', transition: 'all 0.5s ease-out' }} // Set initial styles
        >
          {player.Fuel}
        </p>
      ))}
    </div>
  );
};

export default PlayerMovement;
