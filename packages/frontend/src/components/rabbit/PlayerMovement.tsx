import React, { useEffect, useRef, useState } from "react";
import { ConnectedUser, RabbitHolePhases } from "../../screens/RabbitHole";

const PlayerMovement = ({ phase, players, isRolling }: {phase: RabbitHolePhases; players: ConnectedUser[], isRolling: boolean}) => {
  const [prevStage, setPrevStage] = useState<undefined | string>(undefined);

  // Sort players by Fuel submitted
  const sortedPlayers = [...players].sort((a, b) => b.Fuel - a.Fuel);

  const playerRefs = useRef<(React.RefObject<HTMLImageElement>)[]>([]);
  const fuelRefs = useRef<(React.RefObject<HTMLParagraphElement>)[]>([]);

  // Update refs when players change
  useEffect(() => {
    playerRefs.current = players.map((_, i) => playerRefs.current[i] || React.createRef());
    fuelRefs.current = players.map((_, i) => fuelRefs.current[i] || React.createRef());
  }, [players]);

  // Handle the animations when the phase changes or players change
  useEffect(() => {
    //console.log({ prevStage, phase });

    if (prevStage !== phase || players.length !== playerRefs.current.length) {
      //console.log("REFRESHING POS...");

      sortedPlayers.forEach((player, index) => {
        const playerElement = playerRefs.current[index]?.current;
        const fuelElement = fuelRefs.current[index]?.current;
        if (!playerElement || !fuelElement) return;

        const positionStyle = `${28 * index}px`;
        setPrevStage(phase);

        if (['Reset', 'Default'].includes(phase)) {
          setTimeout(() => {
            console.log(">>>>>>>>>>>>>>> RESET/DEFAULT TUNNEL");
            playerElement.style.transition = 'all 1.5s ease-out';
            playerElement.style.left = '50%';
            playerElement.style.visibility = 'visible';
            playerElement.style.top = positionStyle;

            fuelElement.style.transition = 'all 1.5s ease-out';
            fuelElement.style.left = '50%';
            fuelElement.style.visibility = 'visible';
            fuelElement.style.top = positionStyle;
            fuelElement.style.opacity = '0';
          }, index * 300);
        } else if (phase === 'CloseTunnel') {
          console.log(">>>>>>>>>>>>>>>>>>>>>>>> CLOSE TUNNEL");
          setTimeout(() => {
            playerElement.style.transition = 'all 0.5s ease-out';
            playerElement.style.left = '-100%';

            fuelElement.style.transition = 'all 0.5s ease-out';
            fuelElement.style.left = '-100%';
            fuelElement.style.opacity = '0';
          }, 3000);
        } else if (phase === 'OpenTunnel') {
          const delay = index * 1000;
          setTimeout(() => {
            console.log(">>>>>>>>>>>>>>>>>>>>>>> OPEN TUNNEL");
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
  }, [phase, sortedPlayers, prevStage, playerRefs, fuelRefs, isRolling, players]);

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




/*

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
*/
