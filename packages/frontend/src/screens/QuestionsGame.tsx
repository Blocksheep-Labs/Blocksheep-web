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
import { useSmartAccount } from "../hooks/smartAccountProvider";
export interface SwipeSelectionAPI {
  swipeLeft: () => void;
  swipeRight: () => void;
}


type ModalType = "ready" | "loading" | "win" | "race" | "waiting" | "waiting-after-finish" | "waiting-before-finish";

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
  const [boardPermanentlyOpened, setBoardPermanentlyOpened] = useState(false);
  const [distributePermanentlyOpened, setDistributePermanentlyOpened] = useState(false);
  const [waitingToFinishModalPermanentlyOpened, setWaitingToFinishModalPermanentlyOpened] = useState(false);
  const [raceboardProgress, setRaceboardProgress] = useState<{ curr: number; delta: number; address: string }[]>([]);
  const questions = location.state?.questionsByGames[currentGameIndex];
  const { step, completed, of, isDistributed, questionsByGames, waitingToFinish } = location.state;
  //const amountOfRegisteredUsers = location.state?.amountOfRegisteredUsers;
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [finished, setFinished] = useState(questions.length === completed);
  const [amountOfPlayersCompleted, setAmountOfPlayersCompleted] = useState(0);
  const [amountOfPlayersWaitingToFinish, setAmountOfPlayersWaitingToFinish] = useState(0);
  const [amountOfPlayersRaceboardNextClicked, setAmountOfPlayersRaceboardNextClicked] = useState(0);
  const { smartAccountClient } = useSmartAccount();
  const [raceData, setRaceData] = useState<any>(undefined);
  // this would be an array of arrays of answers [[0,1], [1,0], [1,1]]
  const [usersAnswers, setUserAnswers] = useState<any[]>([]);


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
        setRaceData(data);
        let newProgress: { curr: number; delta: number; address: string }[] = data.progress.map(i => {
          return { curr: Number(i.progress), delta: 0, address: i.user };
        });
        console.log("NEW PROGRESS:", newProgress)
        setRaceboardProgress(newProgress);
      }
    });
  };
  
  const onClickLike = async(sendTx=true) => {
    setSubmittingAnswer(true);
    pause();

    console.log("UPDATE PROGRESS", {
      raceId,
      userAddress: user?.wallet?.address,
      property: "game1++",
      value: {
        completed: currentQuestionIndex + 1,
        of: Number(questions.length),
        answer: 1,
      }
    });

    socket.emit('update-progress', {
      raceId,
      userAddress: user?.wallet?.address,
      property: "game1++",
      value: {
        completed: currentQuestionIndex + 1,
        of: Number(questions.length),
        answer: 1,
      }
    });
    
    sendTx && await submitUserAnswer(
      Number(raceId), 
      currentGameIndex, 
      currentQuestionIndex,
      0,
      smartAccountClient
    ).then(async hash => {
      await waitForTransactionReceipt(config, {
        hash,
        confirmations: 2
      });
    }).catch(err => {
      console.log(err);
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
        completed: currentQuestionIndex + 1,
        of: Number(questions.length),
        answer: 0,
      }
    });

    socket.emit('update-progress', {
      raceId,
      userAddress: user?.wallet?.address,
      property: "game1",
      value: {
        completed: currentQuestionIndex + 1,
        of: Number(questions.length),
        answer: 0,
      }
    });

    sendTx && await submitUserAnswer(
      Number(raceId), 
      currentGameIndex, 
      currentQuestionIndex,
      1,
      smartAccountClient
    ).then(async hash => {
      await waitForTransactionReceipt(config, {
        hash,
        confirmations: 2
      });
    }).catch(err => {
      console.log(err);
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
    console.log("loading modal opened")
    setIsOpen(true);
    setModalType("loading");
  }

  function closeLoadingModal() {
    console.log("loading modal closed")
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
  }

  function openWinModal() {
    console.log("win modal opened")
    setFinished(true);
    setIsOpen(true);
    setModalType("win");
  }

  function closeWinModal() {
    console.log("win modal closed")
    setIsOpen(false);
    setModalType(undefined);
    updateProgress();
    openRaceModal();
  }

  function closeBoardModal() {
    console.log("close board modal")
    setIsOpen(false);
    setModalType(undefined);
    setBoardPermanentlyOpened(false);
  }

  function openWaitingAfterFinishModal() {
    setIsOpen(true);
    setModalType("waiting-after-finish");
  }

  function closeWaitingBeforeFinishModal() {
    setIsOpen(false);
    setModalType(undefined);
    setWaitingToFinishModalPermanentlyOpened(false);
  }

  function openWaitingBeforeFinishModal() {
    setIsOpen(true);
    setModalType("waiting-before-finish");
  }

  function openRaceModal() {
    console.log("open board modal")
    setIsOpen(true);
    setModalType("race");
  }

  function closeRaceModal() {
    if (raceData?.numberOfPlayersRequired <= amountOfPlayersRaceboardNextClicked + 1) {
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
    console.log("FINISH, waiting for players...");
    socket.emit("update-progress", {
      raceId,
      userAddress: user?.wallet?.address,
      property: "game1-wait-to-finish",
    });
    openWaitingBeforeFinishModal();
  }
  
  // handle socket events
  useEffect(() => {
    if (user?.wallet?.address && raceData) {
      socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
        console.log("AMOUNT OF CONNECTED:", amount, raceIdSocket, raceId)
        if (raceId == raceIdSocket) {
          setAmountOfConnected(amount);
          // handle amount of connected
          if (amount === raceData.numberOfPlayersRequired && modalType !== "race") {
            setIsOpen(false);
            setModalType(undefined);
          }
        }
      });

      socket.on('joined', ({ raceId: raceIdSocket, userAddress }) => {
        if (raceId == raceIdSocket) {
          setAmountOfConnected(amountOfConnected + 1);
          if (amountOfConnected + 1 >= raceData.numberOfPlayersRequired) {
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
        console.log("PROGRESS UPDATED SOCKET EVENT:", progress)
        if (progress.property === "game1-distribute") {
          // if the user is sending the TX or finished sending TX
          setAmountOfPlayersCompleted(amountOfPlayersCompleted + 1);
          console.log("GAME1 DISTRIBUTE:", amountOfPlayersCompleted + 1, finished);
          if ((raceData.numberOfPlayersRequired == amountOfPlayersCompleted + 1)) {
            console.log("CLOSING MODAL..., openning win modal")
            openWinModal();
          }
        }

        if (progress.property === "board1") {
          setAmountOfPlayersRaceboardNextClicked(amountOfPlayersRaceboardNextClicked + 1);
          console.log("GAME1 BOARD++", amountOfPlayersRaceboardNextClicked + 1);
          if ((raceData.numberOfPlayersRequired == amountOfPlayersRaceboardNextClicked + 1) && finished) {
            console.log("MOVING TO NEXT GAME...");
            closeBoardModal();
            nextClicked();
          }
        }

        if (progress.property === "game1-wait-to-finish") {
          setAmountOfPlayersWaitingToFinish(amountOfPlayersWaitingToFinish + 1);
          console.log("WAITING TO FINISH++", amountOfPlayersWaitingToFinish + 1);
          if (raceData.numberOfPlayersRequired <= amountOfPlayersWaitingToFinish + 1) {
            console.log("DISTRIBUTING REWARD...");
            // track users answers (to reduce amount of txs in loadingModal on distribute reward step)
            setUserAnswers([...usersAnswers, progress.rProgress.progress.game1.answers]);
            closeWaitingBeforeFinishModal();
            openLoadingModal();
          }
        }
      });

      socket.on('race-progress-questions', ({progress}) => {
        console.log("RACE PROGRESS QUESTIONS:", progress);
        let isDistributedAmount = 0;
        let boardNextClickedAmount = 0;
        let waitingToFinishAmount = 0;
        let answers: any[] = [];
        progress.forEach((i: any) => {
          if (i.progress.game1.isDistributed) {
            isDistributedAmount++;
          }

          if (i.progress.board1) {
            boardNextClickedAmount++;
          }

          if (i.progress.game1.waitingToFinish) {
            waitingToFinishAmount++;
            answers.push(i.progress.game1.answers);
          }
        });

        console.log({isDistributedAmount, boardNextClickedAmount, waitingToFinishAmount});
        setAmountOfPlayersCompleted(isDistributedAmount);
        setAmountOfPlayersRaceboardNextClicked(boardNextClickedAmount);
        setAmountOfPlayersWaitingToFinish(waitingToFinishAmount);
        setUserAnswers(answers);
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
  }, [socket, amountOfConnected, user?.wallet?.address, finished, amountOfPlayersCompleted, amountOfPlayersRaceboardNextClicked, raceData, amountOfPlayersWaitingToFinish]);

  // fetch server-side data
  useEffect(() => {
    if (user?.wallet?.address && raceData) {
      console.log(">>>>>>>>>>>>>> EFFECT <<<<<<<<<<<<<<<")
      socket.emit("get-connected", { raceId });
      socket.emit("get-progress", { raceId, userAddress: user.wallet.address });
      socket.emit("get-progress-questions", { raceId });
    }
  }, [socket, user?.wallet?.address, raceData]); 


  function nextClicked() {
    navigate(`/race/${raceId}/tunnel`);
  }

  // INITIAL USE EFFECT
  useEffect(() => {
    if (user?.wallet?.address) {
      updateProgress();

      // user finished the game
      if (step === "board") {
        console.log("BOARD");
        pause();
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

      // start waiting other players to finish answering
      if (waitingToFinish) {
        pause();
        setWaitingToFinishModalPermanentlyOpened(true);
        return;
      }
      
      // user answered all questions but score was not calculated
      if (!waitingToFinish && completed >= of && completed > 0 && of > 0 && !isDistributed && step == "questions") {
        pause();
        setDistributePermanentlyOpened(true);
        return;
      }
    }
  }, [step, completed, of, isDistributed, questionsByGames, user?.wallet?.address, waitingToFinish]);

  //console.log("CURRENT Q INDEX:", currentQuestionIndex);
  console.log(amountOfConnected, raceData?.numberOfPlayersRequired);
  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-play_pattern bg-cover bg-bottom">
      <div className="relative my-4">
        <Timer seconds={totalSeconds} />
        <div className="absolute right-4 top-0">
          <UserCount currentAmount={amountOfConnected} requiredAmount={raceData?.numberOfPlayersRequired || 9}/>
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
            <LoadingModal closeHandler={closeLoadingModal} raceId={Number(raceId)} gameIndex={currentGameIndex} questionIndexes={Array.from(Array(Number(questions.length)).keys())} answers={usersAnswers}/>
          }
          {
            modalType === "win" && 
            <WinModal handleClose={closeWinModal} raceId={Number(raceId)} gameIndex={currentGameIndex}/>
          }
          {
            modalType === "race" && 
            <RaceModal progress={raceboardProgress || []} handleClose={closeRaceModal} disableBtn={amountOfConnected !== (raceData?.numberOfPlayersRequired || 9)}/>
          }
          {
            modalType === "waiting" && 
            <WaitingForPlayersModal numberOfPlayers={amountOfConnected} numberOfPlayersRequired={raceData?.numberOfPlayersRequired || 9}/> 
          }
          {
            modalType && ["waiting-after-finish", "waiting-before-finish"].includes(modalType) && 
            <WaitingForPlayersModal numberOfPlayers={amountOfConnected} numberOfPlayersRequired={raceData?.numberOfPlayersRequired || 9} replacedText="..."/> 
          }
        </>
      )}

      {
        boardPermanentlyOpened && 
        <RaceModal progress={raceboardProgress || []} handleClose={closeRaceModal} disableBtn={amountOfConnected !== (raceData?.numberOfPlayersRequired || 9)}/>
      }
      {
        distributePermanentlyOpened && 
        <LoadingModal closeHandler={closeLoadingModal} raceId={Number(raceId)} gameIndex={currentGameIndex} questionIndexes={Array.from(Array(Number(questions.length)).keys())} answers={usersAnswers}/>
      }
      {
        waitingToFinishModalPermanentlyOpened &&
        <WaitingForPlayersModal numberOfPlayers={amountOfConnected} numberOfPlayersRequired={raceData?.numberOfPlayersRequired || 9} replacedText="..."/> 
      }
    </div>
  );
}

export default QuestionsGame;