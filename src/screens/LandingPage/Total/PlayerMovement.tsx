// import _ from "lodash";
import { useEffect, useMemo, useRef } from "react";
// import useIsMobile from "@/hooks/useIsMobile"

const PlayerMovement = ({ phase, players }) => {
  // const player1Ref = useRef() as any;
  // const player2Ref = useRef() as any;
  // const player3Ref = useRef() as any;
  // const sortedPlayers = _.sortBy(players, "speed").reverse();

  // const playersRef = useMemo(
  //   () => [player1Ref, player2Ref, player3Ref],
  //   [player1Ref, player2Ref, player3Ref],
  // );

  useEffect(() => {
    const init = () => {
      // eslint-disable-next-line array-callback-return
      // sortedPlayers.map((__, index) => {
      //   // const topPixel = useIsMobile ? 12 : 20
      //   const topPixel = 12;
      //   const positionStyle = `${topPixel * index}px`;
      //   const playerElement = playersRef[index].current;
      //   if (!playerElement) return;

      //   if (phase === "Default" || phase === "Reset") {
      //     setTimeout(() => {
      //       playerElement.style.transition = "all 1.5s ease-out";
      //       playerElement.style.left = "50%";
      //       playerElement.style.visibility = "visible";
      //       playerElement.style.top = positionStyle;
      //     }, index * 300);
      //   } else if (phase === "CloseTunnel") {
      //     playerElement.style.left = "80%";
      //     setTimeout(() => {
      //       playerElement.style.transition = "all 0.5s ease-out";
      //       playerElement.style.left = "-100%";
      //     }, 3000);
      //   } else if (phase === "OpenTunnel") {
      //     const delay = index * 1000;
      //     setTimeout(() => {
      //       playerElement.style.top = positionStyle;
      //       playerElement.style.left = "150vw";
      //       playerElement.style.transition = "all 12s ease-out";
      //     }, 1000 + delay);

      //     setTimeout(() => {
      //       playerElement.style.visibility = "hidden";
      //       playerElement.style.left = "-10vw";
      //       playerElement.style.transition = "none";
      //     }, 9000 + delay);
      //   }
      // });
    };

    init();
  }, [phase, sortedPlayers, playersRef]);

  return (
    <div className="player-container">
      {sortedPlayers.map((player, index) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          ref={playersRef[index]}
          src={player.src}
          alt={player.id}
          className={`player-${player.id}`}
        />
      ))}
    </div>
  );
};

export default PlayerMovement;
