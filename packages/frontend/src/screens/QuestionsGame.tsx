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
import { finished } from "stream";
export interface SwipeSelectionAPI {
  swipeLeft: () => void;
  swipeRight: () => void;
}

const GAME_NAME = "questions";
const AMOUNT_OF_PLAYERS_PER_RACE = 2;

type ModalType = "ready" | "loading" | "win" | "race" | "waiting" | "waiting-after-finish";

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
  const [boardPermanentlyOpened, setBoardPermanentlyOpened] = useState(false);
  const [distributePermanentlyOpened, setDistributePermanentlyOpened] = useState(false);
  const [raceboardProgress, setRaceboardProgress] = useState<{ curr: number; delta: number; address: string }[]>([]);
  const progress  = location.state?.progress;
  const questions = location.state?.questionsByGames[currentGameIndex];
  const { step, completed, of, isDistributed, questionsByGames } = location.state;
  //const amountOfRegisteredUsers = location.state?.amountOfRegisteredUsers;
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [finished, setFinished] = useState(questions.length === completed);
  const [amountOfPlayersCompleted, setAmountOfPlayersCompleted] = useState(0);
  const [amountOfPlayersRaceboardNextClicked, setAmountOfPlayersRaceboardNextClicked] = useState(0);

  const time = new Date();
  time.setSeconds(time.getSeconds() + 10);

  useEffect(() => {
    if (!modalIsOpen && !boardPermanentlyOpened && !distributePermanentlyOpened) {
      console.log("flipState set time ", flipState);
      const time = new Date();
      time.setSeconds(time.getSeconds() + 10);
      restart(time);
      resume();
    } else {
      pause();
    }
  }, [flipState, modalIsOpen, boardPermanentlyOpened, distributePermanentlyOpened]);

  const { totalSeconds, restart, pause, resume } = useTimer({
    expiryTimestamp: time,
    onExpire: () => {
      setFlipState(!flipState);
      flipState ? onClickLike(false) : onClickDislike(false);
    },
  });

  const updateProgress = () => {
    getRaceById(Number(raceId), user?.wallet?.address as `0x${string}`).then(data => {
      if (data) {
        let newProgress: { curr: number; delta: number; address: string }[] = data.progress.map(i => {
          return { curr: Number(i.progress), delta: 0, address: i.user };
        });
        console.log("NEW PROGRESS:", newProgress)
        setRaceboardProgress(newProgress);
      }
    });
    
    /*
    setProgress((old: any) =>
      old.map(({ curr, delta, address }: {curr: number, delta: number, address: string}) => {
        return {
          curr: (curr + delta) % 10,
          delta: Math.ceil(Math.random() * 2) % 10,
          address
        };
      }),
    );
    */
  };
  
  const onClickLike = async(sendTx=true) => {
    setSubmittingAnswer(true);
    pause();

    console.log("UPDATE PROGRESS", {
      raceId,
      userAddress: user?.wallet?.address,
      property: "game1++",
      value: {
        of: Number(questions.length),
      }
    });

    socket.emit('update-progress', {
      raceId,
      userAddress: user?.wallet?.address,
      property: "game1++",
      value: {
        of: Number(questions.length),
      }
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

    if (currentQuestionIndex !== questions.length)
      setCurrentQuestionIndex(currentQuestionIndex + 1);
  };


  const onClickDislike = async(sendTx=true) => {
    setSubmittingAnswer(true);
    pause();

    console.log("UPDATE PROGRESS", {
      raceId,
      userAddress: user?.wallet?.address,
      property: "game1++",
      value: {
        of: Number(questions.length),
      }
    });

    socket.emit('update-progress', {
      raceId,
      userAddress: user?.wallet?.address,
      property: "game1",
      value: {
        completed: currentQuestionIndex + 1,
        of: Number(questions.length),
      }
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
    if (currentQuestionIndex !== questions.length)
      setCurrentQuestionIndex(currentQuestionIndex + 1);
  };

  function openLoadingModal() {
    setIsOpen(true);
    setModalType("loading");
  }

  function closeLoadingModal() {
    setDistributePermanentlyOpened(false);
    setIsOpen(false);
    setModalType(undefined);
    socket.emit("update-progress", {
      raceId,
      userAddress: user?.wallet?.address,
      property: "game1-distribute",
      value: {
        completed: Number(questions.length),
        of: Number(questions.length),
        isDistributed: true,
      }
    });
    openWinModal();
  }

  function openWinModal() {
    setFinished(true);
    setIsOpen(true);
    setModalType("win");
  }

  function closeWinModal() {
    if (amountOfPlayersCompleted >= AMOUNT_OF_PLAYERS_PER_RACE) {
      setIsOpen(false);
      setModalType(undefined);
      updateProgress();
      openRaceModal();
    } else {
      openWaitingAfterFinishModal();
    }
  }

  function openWaitingAfterFinishModal() {
    setIsOpen(true);
    setModalType("waiting-after-finish");
  }

  function openRaceModal() {
    setIsOpen(true);
    setModalType("race");
  }

  function closeRaceModal() {
    if (AMOUNT_OF_PLAYERS_PER_RACE <= amountOfPlayersRaceboardNextClicked + 1) {
      setBoardPermanentlyOpened(false);
      setIsOpen(false);
      setModalType(undefined);
      setRoundId(roundId + 1);
      nextClicked();
    } else {
      openWaitingAfterFinishModal();
    }
    
    // user is now watched the progress after the first game
    socket.emit('update-progress', { 
      raceId, 
      userAddress: user?.wallet?.address,
      property: "board1",
      value: true,
    });
  }

  function onFinish() {
    console.log("FINISH, open loading modal...")
    openLoadingModal();
  }
  
  // handle socket events
  useEffect(() => {
    if (user?.wallet?.address) {
      socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
        console.log("AMOUNT OF CONNECTED:", amount, raceIdSocket, raceId)
        if (raceId == raceIdSocket) {
          setAmountOfConnected(amount);
          // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
          if (amount === AMOUNT_OF_PLAYERS_PER_RACE) {
            setIsOpen(false);
            setModalType(undefined);
          }
        }
      });

      socket.on('joined', ({ raceId: raceIdSocket, userAddress }) => {
        if (raceId == raceIdSocket) {
          setAmountOfConnected(amountOfConnected + 1);
          if (amountOfConnected + 1 >= AMOUNT_OF_PLAYERS_PER_RACE) {
            if (modalType === "waiting" && !finished) {
              updateProgress();
              setIsOpen(false);
              setModalType(undefined);
            }
            // unpause timer
            if (!finished) {
              setSubmittingAnswer(false);
              resume();
            }
          }
        }
      });

      socket.on('leaved', () => {
        setAmountOfConnected(amountOfConnected - 1);
        if (!modalIsOpen && !finished) {
          setIsOpen(true);
          setModalType("waiting");
        }
        // pause timer
        setSubmittingAnswer(true);
        pause();
      });

      socket.on("progress-updated", async(progress) => {
        if (progress.property === "game1-distribute") {
          // if the user is sending the TX or finished sending TX
          setAmountOfPlayersCompleted(amountOfPlayersCompleted + 1);
          console.log("GAME1 DISTRIBUTE:", amountOfPlayersCompleted + 1, finished);
          if ((AMOUNT_OF_PLAYERS_PER_RACE == amountOfPlayersCompleted + 1) && finished) {
            console.log("CLOSING MODAL...")
            setIsOpen(false);
            setModalType(undefined);
            updateProgress();
            openRaceModal();
          }
        }

        if (progress.property === "board1") {
          setAmountOfPlayersRaceboardNextClicked(amountOfPlayersRaceboardNextClicked + 1);
          console.log("GAME1 BOARD++", amountOfPlayersRaceboardNextClicked + 1);
          if ((AMOUNT_OF_PLAYERS_PER_RACE == amountOfPlayersRaceboardNextClicked + 1) && finished) {
            console.log("MOVING TO NEXT GAME...");
            setIsOpen(false);
            setModalType(undefined);
            nextClicked();
          }
        }
      });

      socket.on('race-progress-questions', ({progress}) => {
        console.log("RACE PROGRESS QUESTIONS:", progress);
        let isDistributedAmount = 0;
        let boardNextClickedAmount = 0;
        progress.forEach((i: any) => {
          if (i.progress.game1.isDistributed) {
            isDistributedAmount++;
          }

          if (i.progress.board1) {
            boardNextClickedAmount++;
          }
        });

        console.log({isDistributedAmount, boardNextClickedAmount});
        setAmountOfPlayersCompleted(isDistributedAmount);
        setAmountOfPlayersRaceboardNextClicked(boardNextClickedAmount);
      });
  
      return () => {
        socket.off('joined');
        socket.off('amount-of-connected');
        socket.off('leaved');
        socket.off('race-progress');
        socket.off('progress-updated');
        socket.off('race-progress-questions');
      }
    }
  }, [socket, amountOfConnected, user?.wallet?.address, finished, amountOfPlayersCompleted, amountOfPlayersRaceboardNextClicked]);

  // fetch required amount of users to wait
  useEffect(() => {
    if (user?.wallet?.address) {
      socket.emit("get-connected", { raceId });
      socket.emit("get-progress", { raceId, userAddress: user.wallet.address });
      socket.emit("get-progress-questions", { raceId });
    }
  }, [socket, user?.wallet?.address]); 


  function nextClicked() {
    navigate(`/race/${raceId}/tunnel`);
  }

  // set maximum game index
  useEffect(() => {
    if (user?.wallet?.address) {
      // user finished the game
      if (step === "board") {
        console.log("BOARD");
        pause();
        updateProgress();
        setBoardPermanentlyOpened(true);
        return;
      }

      if (isDistributed) {
        pause();
        setBoardPermanentlyOpened(true);
        return;
      }
  
      // continue answering questions
      if (completed != of && completed < of && step == "questions") {
        console.log("CONTINUE FROM", completed);
        setCurrentQuestionIndex(completed);
        return;
      }
  
      // user answered all questions but score was not calculated
      if (completed >= of && completed > 0 && of > 0 && !isDistributed && step == "questions") {
        pause();
        setDistributePermanentlyOpened(true);
        return;
      }
    }
  }, [step, completed, of, isDistributed, questionsByGames, user?.wallet?.address]);

  console.log("CURRENT Q INDEX:", currentQuestionIndex);

  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-play_pattern bg-cover bg-bottom">
      <div className="relative my-4">
        <Timer seconds={totalSeconds} />
        <div className="absolute right-4 top-0">
          <UserCount currentAmount={amountOfConnected} requiredAmount={AMOUNT_OF_PLAYERS_PER_RACE}/>
        </div>
      </div>
      {
        currentQuestionIndex !== questions.length 
        &&
        <SwipeSelection 
          key={roundId.toString()} 
          ref={ref} 
          onFinish={onFinish} 
          questions={questions || []}
          currentQuestionIndex={currentQuestionIndex}
        />
      }
      
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
            <RaceModal progress={raceboardProgress || []} handleClose={closeRaceModal} disableBtn={amountOfConnected !== AMOUNT_OF_PLAYERS_PER_RACE}/>
          }
          {
            modalType === "waiting" && 
            <WaitingForPlayersModal numberOfPlayers={amountOfConnected} numberOfPlayersRequired={AMOUNT_OF_PLAYERS_PER_RACE}/> 
          }
          {
            modalType === "waiting-after-finish" && 
            <WaitingForPlayersModal numberOfPlayers={amountOfConnected} numberOfPlayersRequired={AMOUNT_OF_PLAYERS_PER_RACE} replacedText="..."/> 
          }
        </>
      )}

      {
        boardPermanentlyOpened && 
        <RaceModal progress={raceboardProgress || []} handleClose={closeRaceModal} disableBtn={amountOfConnected !== AMOUNT_OF_PLAYERS_PER_RACE}/>
      }
      {
        distributePermanentlyOpened && 
        <LoadingModal closeHandler={closeLoadingModal} raceId={Number(raceId)} gameIndex={currentGameIndex} questionIndexes={Array.from(Array(Number(questions.length)).keys())} />
      }
    </div>
  );
}

export default QuestionsGame;