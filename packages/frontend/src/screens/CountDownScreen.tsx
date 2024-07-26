import React, { useEffect, useState } from "react";
import RaceBoard from "../components/RaceBoard";
import { useNavigate, useParams } from "react-router-dom";
import { getRaceById } from "../utils/contract-functions";
import { usePrivy } from "@privy-io/react-auth";

function CountDownScreen() {
  const { user } = usePrivy();
  const [seconds, setSeconds] = useState(5);
  const navigate = useNavigate();
  const {raceId} = useParams();
  const [questionsByGames, setQuestionsByGames] = useState<any[]>([]);
  const [progress, setProgress] = useState<{ curr: number; delta: number; address: string }[]>([]);
  const [gameIndex, setGameIndex] = useState(0);
  const [amountOfRegisteredUsers, setAmountOfRegisteredUsers] = useState(0);

  const handleClose = async() => {
    navigate(`/race/${raceId}/${questionsByGames.length}/${gameIndex}/questions`, {
      state: {questionsByGames, amountOfRegisteredUsers, progress}
    });
  };

  useEffect(() => {
    if (raceId?.length && user?.wallet?.address) {
      getRaceById(Number(raceId), user.wallet.address as `0x${string}`).then(data => {
        if (data) {
          // VALIDATE USER FOR BEING REGISTERED
          if (!data.registeredUsers.includes(user.wallet?.address)) {
            navigate('/');
          } 

          // IF USER ANSWERED ALL THE QUESTIONS-GAMES
          console.log(data, data.numberOfGames, data.gamesCompletedPerUser.length)
          if (data.numberOfGames === data.gamesCompletedPerUser.length) {
            navigate(`/race/${raceId}/tunnel`)
          }

          setQuestionsByGames(data.questionsByGames);
          setAmountOfRegisteredUsers(data.registeredUsers.length);
          setGameIndex(data.gamesCompletedPerUser.length);

          let newProgress: { curr: number; delta: number; address: string }[] = data.progress.map(i => {
            return { curr: Number(i.progress), delta: 0, address: i.user };
          });
      
          setProgress(newProgress);
  
          const interval = setInterval(() => {
            setSeconds((old) => (old > 0 ? old - 1 : 0));
          }, 1000);
      
          return () => {
            clearInterval(interval);
          };
        }
      });
    }
  }, [raceId, user?.wallet?.address]);

  useEffect(() => {
    // eslint-disable-next-line no-undef
    let timer: NodeJS.Timeout;
    if (seconds === 0) {
      timer = setTimeout(handleClose, 1000);
      handleClose();
    }
    return () => {
      clearTimeout(timer);
    };
  }, [seconds]);
  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom">
      <div className="absolute inset-0 bg-[rgb(153,161,149)]">
        <RaceBoard progress={progress} />
        <div className="absolute left-0 top-0 flex size-full items-center justify-center">
          <div className="flex size-36 items-center justify-center rounded-3xl bg-yellow-500">
            <p className="font-[Berlin] text-[70px]">{seconds === 0 ? "GO" : seconds}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CountDownScreen;
