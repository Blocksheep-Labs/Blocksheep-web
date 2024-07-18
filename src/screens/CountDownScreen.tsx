import React, { useEffect, useState } from "react";
import RaceBoard from "../components/RaceBoard";
import { useNavigate, useParams } from "react-router-dom";
import { getRaceById } from "../utils/contract-functions";

function CountDownScreen() {
  const [seconds, setSeconds] = useState(5);
  const navigate = useNavigate();
  const {raceId} = useParams();
  const [questionsByGames, setQuestionsByGames] = useState<any[]>([]);
  const [progress, setProgress] = useState<{ curr: number; delta: number }[]>([]);

  const handleClose = () => {
    navigate(`/race/${raceId}/${questionsByGames.length}`, {
      state: {questionsByGames}
    });
  };


  useEffect(() => {
    if (raceId?.length) {
      getRaceById(Number(raceId)).then(data => {
        if (data) {
          setQuestionsByGames(data.questionsByGames);
          console.log(data.questionsByGames)

          let newProgress: { curr: number; delta: number }[] = Array.from({ length: 3 }, () => {
            return { curr: 1, delta: 0 };
          });
      
          console.log("new progress", newProgress);
      
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
  }, [raceId]);

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
