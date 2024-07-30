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
import { socket } from "../utils/socketio";
import WaitingForPlayersModal from "../components/WaitingForPlayersModal";
export interface SwipeSelectionAPI {
  swipeLeft: () => void;
  swipeRight: () => void;
}

const GAME_NAME = "questions";

type ModalType = "ready" | "loading" | "win" | "race" | "waiting";

function QuestionsGame() {
  const { user } = usePrivy();
  const navigate = useNavigate();
  const ref: RefObject<SwipeSelectionAPI> = useRef(null);
  const [roundId, setRoundId] = useState(0);
  const [modalType, setModalType] = useState<ModalType | undefined>(undefined);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [flipState, setFlipState] = useState(true);
  const {raceId, gameId} = useParams();
  const location = useLocation();
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [playersJoined, setPlayersJoined] = useState(0);
  const [progress, setProgress] = useState(
    location.state?.progress
  );
  const questions = location.state?.questionsByGames[currentGameIndex];
  const amountOfRegisteredUsers = location.state?.amountOfRegisteredUsers;
  const [usersRequired, setUsersRequired] = useState(amountOfRegisteredUsers);

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
      old.map(({ curr, delta, address }: {curr: number, delta: number, address: string}) => {
        return {
          curr: (curr + delta) % 10,
          delta: Math.ceil(Math.random() * 2) % 10,
          address
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
    if (playersJoined === usersRequired) {
      setIsOpen(false);
      setModalType(undefined);
      updateProgress();
      openRaceModal();
    } else {
      setModalType("waiting")
    }
  }

  function openRaceModal() {
    // notify the race completion
    socket.emit('complete-game', { 
      raceId, 
      gameId, 
      game: GAME_NAME, 
      userAddress: user?.wallet?.address 
    });
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
          return { curr: Number(i.progress), delta: 0, address: i.user };
        });
        setProgress(newProgress);
      }
    });

    nextClicked();
  }

  function onFinish() {
    openLoadingModal();
  }

  // CONNECT SOCKET
  useEffect(() => {
    socket.emit("connect-live-game", { 
      raceId, 
      userAddress: user?.wallet?.address, 
      game: "questions" 
    });
  }, []);
  
  useEffect(() => {
    socket.on('joined', (data) => {
      console.log(data.game, GAME_NAME)
      if (data.game === GAME_NAME) {
        console.log("USER JOINED", data);
        setPlayersJoined(playersJoined + 1);
        if (playersJoined === usersRequired) {
          setIsOpen(false);
          setModalType(undefined);
          updateProgress();
          openRaceModal();
        }
      }
    });

    socket.on('changed-game', (data) => {
      if (data.game === GAME_NAME) {
        console.log("CHANGED GAME", data);
        setPlayersJoined(playersJoined + 1);
        if (playersJoined === usersRequired) {
          setIsOpen(false);
          setModalType(undefined);
          updateProgress();
          openRaceModal();
        }
      }

      if (data.previousGame === GAME_NAME) {
        console.log("CHANGED GAME (LEFT)", data);
        setPlayersJoined(playersJoined - 1);
        if (playersJoined !== usersRequired) {
          setIsOpen(true);
          setModalType("waiting");
        }
      }
    });

    socket.on('completed-game', (data) => {
      if (data.game === GAME_NAME) {
        console.log("COMPLETED GAME", data);
        setUsersRequired(usersRequired - 1);
      }
    });

    socket.on('amount-of-completed', (data) => {
      console.log("AMOUNT OF COMPLETED", data.amount);
      console.log("ANOUNT OF REQUIRED", amountOfRegisteredUsers - data.amount);
      setUsersRequired(amountOfRegisteredUsers - data.amount);
    });

    socket.on('leaved', (data) => {
      if (data.game === GAME_NAME) {
        console.log("USER LEAVED", data);
        setPlayersJoined(playersJoined - 1);
      }
    });

    return () => {
      socket.off('joined');
      socket.off('leaved');
      socket.off('changed-game');
      socket.off('completed-game');
      socket.off('amount-of-completed');
    }
  }, [socket, playersJoined, usersRequired, user?.wallet?.address]);

  // fetch required amount of users to wait
  useEffect(() => {
    socket.emit('get-completed', { raceId, gameId, game: GAME_NAME })
  }, [socket]); 


  function nextClicked() {
    navigate(`/race/${raceId}/tunnel`);
  }

  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-play_pattern bg-cover bg-bottom">
      <div className="relative my-4">
        <Timer seconds={totalSeconds} />
        <div className="absolute right-4 top-0">
          <UserCount currentAmount={playersJoined} requiredAmount={usersRequired}/>
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
          {
            modalType === "waiting" && 
            <WaitingForPlayersModal raceId={Number(raceId)} numberOfPlayers={playersJoined} numberOfPlayersRequired={usersRequired}/> 
          }
        </>
      )}
    </div>
  );
}

export default QuestionsGame;