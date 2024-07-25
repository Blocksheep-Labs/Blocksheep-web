import BottomTab from "../assets/gameplay/bottom-tab.png";
import SelectionBtnBox from "../components/SelectionBtnBox";
import SwipeSelection from "../components/SwipeSelection";
import UserCount from "../components/UserCount";
import { RefObject, useEffect, useRef, useState } from "react";
import LoadingModal from "../components/LoadingModal";
import WinModal from "../components/WinModal";
import RaceModal from "../components/RaceModal";
import Timer from "../components/Timer";
import { useTimer } from "react-timer-hook";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getRaceById, submitUserAnswer } from "../utils/contract-functions";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "../config/wagmi";
import { usePrivy } from "@privy-io/react-auth";
export interface SwipeSelectionAPI {
  swipeLeft: () => void;
  swipeRight: () => void;
}

type ModalType = "ready" | "loading" | "win" | "race";

function QuestionsGame() {
  const { user } = usePrivy();
  const navigate = useNavigate();
  const ref: RefObject<SwipeSelectionAPI> = useRef(null);
  const [roundId, setRoundId] = useState(0);
  const [modalType, setModalType] = useState<ModalType | undefined>(undefined);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [flipState, setFlipState] = useState(true);
  const {raceId} = useParams();
  const location = useLocation();
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [progress, setProgress] = useState(
    location.state?.progress
  );
  const questions = location.state?.questionsByGames[currentGameIndex];
  const amountOfRegisteredUsers = location.state?.amountOfRegisteredUsers;

  const time = new Date();
  time.setSeconds(time.getSeconds() + 10);

  // set maximum game index
  useEffect(() => {
    if (location.state?.questionsByGames?.[currentGameIndex].length) {
      setCurrentQuestionIndex(location.state?.questionsByGames?.[currentGameIndex].length - 1)
    }
  }, [location.state?.questionsByGames.length]);

  useEffect(() => {
    if (!modalIsOpen) {
      console.log("flipState set time ", flipState);
      const time = new Date();
      time.setSeconds(time.getSeconds() + 10);
      restart(time);
    }
  }, [flipState, modalIsOpen]);

  const { totalSeconds, restart, pause, resume } = useTimer({
    expiryTimestamp: time,
    onExpire: () => {
      setFlipState(!flipState);
      flipState ? onClickLike(false) : onClickDislike(false);
    },
  });

  const updateProgress = () => {
    setProgress((old: any) =>
      old.map(({ curr, delta }: {curr: number, delta: number}) => {
        return {
          curr: (curr + delta) % 10,
          delta: Math.ceil(Math.random() * 2) % 10,
        };
      }),
    );
  };
  
  const onClickLike = async(sendTx=true) => {
    setSubmittingAnswer(true);
    pause();

    console.log({
      raceId,
      currentGameIndex,
      currentQuestionIndex,
      answerId: 0,
    });
    
    sendTx && await submitUserAnswer(
      Number(raceId), 
      currentGameIndex, 
      currentQuestionIndex,
      0
    ).then(async hash => {
      await waitForTransactionReceipt(config, {
        hash,
        confirmations: 2
      });
    }).catch(err => {
      console.log("Answer can not be submitted, probably answered already");
    });


    setSubmittingAnswer(false);
    resume();
    
    ref.current?.swipeLeft();

    // reset time
    const time = new Date();
    time.setSeconds(time.getSeconds() + 10);
    restart(time);

    if (currentQuestionIndex !== 0)
      setCurrentQuestionIndex(currentQuestionIndex - 1);
  };


  const onClickDislike = async(sendTx=true) => {
    setSubmittingAnswer(true);
    pause();

    console.log({
      raceId,
      currentGameIndex,
      currentQuestionIndex,
      answerId: 1,
    });

    sendTx && await submitUserAnswer(
      Number(raceId), 
      currentGameIndex, 
      currentQuestionIndex,
      1
    ).then(async hash => {
      await waitForTransactionReceipt(config, {
        hash,
        confirmations: 2
      });
    }).catch(_ => {
      console.log("Answer can not be submitted, probably answered already");
    });

    setSubmittingAnswer(false);
    resume();

    // reset time
    const time = new Date();
    time.setSeconds(time.getSeconds() + 10);
    restart(time);
    
    ref.current?.swipeRight();
    if (currentQuestionIndex !== 0)
      setCurrentQuestionIndex(currentQuestionIndex - 1);
  };

  function openLoadingModal() {
    setIsOpen(true);
    setModalType("loading");
  }

  function closeLoadingModal() {
    setIsOpen(false);
    setModalType(undefined);
    openWinModal();
  }

  function openWinModal() {
    setIsOpen(true);
    setModalType("win");
  }

  function closeWinModal() {
    setIsOpen(false);
    setModalType(undefined);
    updateProgress();
    openRaceModal();
  }

  function openRaceModal() {
    setIsOpen(true);
    setModalType("race");
  }

  function closeRaceModal() {
    setIsOpen(false);
    setModalType(undefined);
    setRoundId(roundId + 1);

    getRaceById(Number(raceId), user?.wallet?.address as `0x${string}`).then(data => {
      if (data) {
        let newProgress: { curr: number; delta: number }[] = data.progress.map(i => {
          return { curr: Number(i.progress), delta: 0 };
        });
        setProgress(newProgress);
      }
    });

    nextClicked();
  }

  function onFinish() {
    openLoadingModal();
  }

  function nextClicked() {
    navigate(`/race/${raceId}/tunnel`);
  }

  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-play_pattern bg-cover bg-bottom">
      <div className="relative my-4">
        <Timer seconds={totalSeconds} />
        <div className="absolute right-4 top-0">
          <UserCount currentAmount={amountOfRegisteredUsers}/>
        </div>
      </div>
      <SwipeSelection 
        key={roundId.toString()} 
        ref={ref} 
        onFinish={onFinish} 
        questions={questions || []}
      />
      
      <div className="m-auto mb-0 w-[65%]">
        <SelectionBtnBox
          leftLabel={questions?.[currentQuestionIndex]?.info.answers[0] || ""}
          rightLabel={questions?.[currentQuestionIndex]?.info.answers[1] || ""}
          leftAction={onClickLike}
          rightAction={onClickDislike}
          disabled={modalIsOpen || submittingAnswer}
        />
      </div>
        
      <div className="self-end">
        <img src={BottomTab} alt="" className="w-full" />
      </div>

      {modalIsOpen && (
        <>
          {
            modalType === "loading" && 
            <LoadingModal closeHandler={closeLoadingModal} raceId={Number(raceId)} gameIndex={currentGameIndex} questionIndexes={Array.from(Array(Number(questions.length)).keys())} />
          }
          {
            modalType === "win" && 
            <WinModal handleClose={closeWinModal} raceId={Number(raceId)} gameIndex={currentGameIndex}/>
          }
          {
            modalType === "race" && 
            <RaceModal progress={progress} handleClose={closeRaceModal} />
          }
        </>
      )}
    </div>
  );
}

export default QuestionsGame;