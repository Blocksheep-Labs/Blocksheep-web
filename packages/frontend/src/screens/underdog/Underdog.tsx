import BottomTab from "../../assets/gameplay/bottom-tab.png";
import SelectionBtnBox from "../../components/SelectionBtnBox";
import SwipeSelection from "../../components/SwipeSelection";
import UserCount from "../../components/UserCount";
import { RefObject, useEffect, useRef, useState } from "react";
import LoadingModal from "../../components/modals/LoadingModal";
import WinModal from "../../components/modals/WinModal";
import Timer from "../../components/Timer";
import { useTimer } from "react-timer-hook";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getRaceById, submitUserAnswer } from "../../utils/contract-functions";
import { waitForTransactionReceipt } from "@wagmi/core";
import { config } from "../../config/wagmi";
import { socket } from "../../utils/socketio";
import WaitingForPlayersModal from "../../components/modals/WaitingForPlayersModal";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import generateLink from "../../utils/linkGetter";
import { txAttempts } from "../../utils/txAttempts";
import DogLoaderImage from "../../assets/underdog/background_head.webp";
import Firework from "../../components/firework/firework";

export interface SwipeSelectionAPI {
  swipeLeft: () => void;
  swipeRight: () => void;
}


type ModalType = "ready" | "loading" | "win" | "race" | "waiting" | "waiting-after-finish" | "waiting-before-finish";

function UnderdogGame() {
  const {smartAccountAddress} = useSmartAccount();
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
  const [distributePermanentlyOpened, setDistributePermanentlyOpened] = useState(false);
  const [waitingToFinishModalPermanentlyOpened, setWaitingToFinishModalPermanentlyOpened] = useState(false);
  const [winModalPermanentlyOpened, setWinModalPermanentlyOpened] = useState(false);

  const [waitingAfterFinishPlayersCount, setWaitingAfterFinishPlayersCount] = useState(0);
  const questions = location.state?.questionsByGames[currentGameIndex];
  const { questionsByGames, progress } = location.state;
  //const amountOfRegisteredUsers = location.state?.amountOfRegisteredUsers;
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [finished, setFinished] = useState(questions.length <= progress?.game1?.completed || false);
  const [amountOfPlayersCompleted, setAmountOfPlayersCompleted] = useState(0);
  const [amountOfPlayersRaceboardNextClicked, setAmountOfPlayersRaceboardNextClicked] = useState(0);
  const { smartAccountClient } = useSmartAccount();
  const [raceData, setRaceData] = useState<any>(undefined);

  const [selectedAnswer, setSelectedAnswer] = useState<"left" | "right" | null>(null);
  const [amountOfAnswersLeft, setAmountOfAnswersLeft] = useState(0);
  const [amountOfAnswersRight, setAmountOfAnswersRight] = useState(0);


  const time = new Date();
  time.setSeconds(time.getSeconds() + 10);

  useEffect(() => {
    if (!modalIsOpen && !distributePermanentlyOpened) {
      console.log("flipState set time ", flipState);
      const time = new Date();
      time.setSeconds(time.getSeconds() + 10);
      restart(time);
      resume();
    } else {
      pause();
    }
  }, [flipState, modalIsOpen, distributePermanentlyOpened]);

  const { totalSeconds, restart, pause, resume } = useTimer({
    expiryTimestamp: time,
    onExpire: () => {
      if (!submittingAnswer) {
        console.log("TIME EXPIRED!")
        setFlipState(!flipState);
        flipState ? onClickLike(currentGameIndex) : onClickDislike(currentGameIndex);
      }
    },
  });

  const updateProgress = () => {
    getRaceById(Number(raceId), smartAccountAddress as `0x${string}`).then((data) => {
      if (data) {
        console.log("SET RACE DATA", {data})
        setRaceData(data);
      }
    });
  };
  
  const onClickLike = async(qIndex: number, sendTx=true) => {
    setSelectedAnswer("left");
    setSubmittingAnswer(true);
    pause();

    console.log("UPDATE PROGRESS", {
      raceId,
      userAddress: smartAccountAddress,
      property: "game1++",
      value: {
        completed: currentQuestionIndex + 1,
        of: Number(questions.length),
        answer: 1,
      }
    });
    
    sendTx && txAttempts(
      5,
      async () => {
        return await submitUserAnswer(
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
        })
      },
      3000
    ).catch(err => {
      //console.log(err);
      console.log("Answer can not be submitted, probably answered already");
    }).finally(() => {
      socket.emit('update-progress', {
        raceId,
        userAddress: smartAccountAddress,
        property: "game1++",
        value: {
          completed: currentQuestionIndex + 1,
          of: Number(questions.length),
          answer: 1,
        }
      });
    });
  };


  const onClickDislike = async(qIndex: number, sendTx=true) => {
    setSelectedAnswer("right");
    setSubmittingAnswer(true);
    pause();

    console.log("UPDATE PROGRESS", {
      raceId,
      userAddress: smartAccountAddress,
      property: "game1++",
      value: {
        completed: currentQuestionIndex + 1,
        of: Number(questions.length),
        answer: 0,
      }
    });

    sendTx && txAttempts(
      5,
      async () => {
        return await submitUserAnswer(
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
        });
      },
      3000,
    ).catch(err => {
      //console.log(err);
      console.log("Answer can not be submitted, probably answered already");
    }).finally(() => {
      socket.emit('update-progress', {
        raceId,
        userAddress: smartAccountAddress,
        property: "game1++",
        value: {
          completed: currentQuestionIndex + 1,
          of: Number(questions.length),
          answer: 0,
        }
      });
    });
  };

  function openLoadingModal() {
    pause();
    console.log("loading modal opened");
    //setIsOpen(true);
    //setModalType("loading");
    setDistributePermanentlyOpened(true);
  }

  function closeLoadingModal() {
    console.log("loading modal closed")
    setDistributePermanentlyOpened(false);
    setIsOpen(false);
    setModalType(undefined);
    socket.emit("update-progress", {
      raceId,
      userAddress: smartAccountAddress,
      property: "game1-distribute",
      value: {
        completed: Number(questions.length),
        of: Number(questions.length),
        isDistributed: true,
      }
    });
    openWinModal();
    pause();
  }

  function openWinModal() {
    console.log("win modal opened");
    setWaitingToFinishModalPermanentlyOpened(false);
    setDistributePermanentlyOpened(false);

    setWinModalPermanentlyOpened(true);
    setFinished(true);
    pause();
  }

  function closeWinModal() {
    console.log("win modal closed")
    setWinModalPermanentlyOpened(false);
    setIsOpen(false);
    setModalType(undefined);
    openWaitingAfterFinishModal();
    pause();
  }


  function openWaitingAfterFinishModal() {
    socket.emit("update-progress", {
      raceId,
      userAddress: smartAccountAddress,
      property: "game1-wait-after-finish",
    });
    setWaitingToFinishModalPermanentlyOpened(true);
    pause();
  }

  function closeWaitingBeforeFinishModal() {
    setIsOpen(false);
    setModalType(undefined);
    setWaitingToFinishModalPermanentlyOpened(false);
    pause();
  }

  function openWaitingBeforeFinishModal() {
    setIsOpen(true);
    setModalType("waiting-before-finish");
  }


  function onFinish() {
    setInterval(pause, 1000);

    /*
    console.log("FINISH, waiting for players...");
    socket.emit("update-progress", {
      raceId,
      userAddress: smartAccountAddress,
      property: "game1-wait-to-finish",
    });
    openWaitingBeforeFinishModal();
    */
    openLoadingModal();
  }
  
  // handle socket events
  useEffect(() => {
    if (smartAccountAddress && raceData) {
      socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
        console.log("AMOUNT OF CONNECTED:", amount, raceIdSocket, raceId)
        if (raceId == raceIdSocket) {
          setAmountOfConnected(amount);
          // handle amount of connected
          if (amount === raceData.numberOfPlayersRequired) {
            setIsOpen(false);
            setModalType(undefined);
          }
        }
      });

      socket.on('joined', ({ raceId: raceIdSocket, userAddress, part }) => {
        if (raceId == raceIdSocket && part == "UNDERDOG") {
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
          socket.emit("get-connected", { raceId });
        }
      });

      socket.on('leaved', ({ part, raceId: raceIdSocket, movedToNext }) => {
        if (part == "UNDERDOG" && raceId == raceIdSocket && !movedToNext) {
          setAmountOfConnected(amountOfConnected - 1);
          if (!modalIsOpen && !finished) {
            setIsOpen(true);
            setModalType("waiting");
          }
          // pause timer
          setSubmittingAnswer(true);
          pause();
        }
      });

      socket.on("progress-updated", async(progress) => {
        console.log("PROGRESS UPDATED SOCKET EVENT:", progress)

        if (progress.property == "game1++") {
          console.log("Submitted answer", progress.value.answer);
                
          // if we have questions amount in sum of answers count
          if (amountOfAnswersLeft + amountOfAnswersRight + 1 == raceData.numberOfPlayersRequired) {
            console.log("Setting timeout...");
            setTimeout(() => {
              console.log("Timeout, next question >>>")
              setSubmittingAnswer(false);
              
              if (selectedAnswer == "right") {
                ref.current?.swipeRight();
              } else {
                ref.current?.swipeLeft();
              }
              
              // reset time
              const time = new Date();
              time.setSeconds(time.getSeconds() + 10);
              restart(time);
              setSelectedAnswer(null);
              setAmountOfAnswersLeft(0);
              setAmountOfAnswersRight(0);
  
              if (currentQuestionIndex !== questions.length - 1)
                setCurrentQuestionIndex(currentQuestionIndex + 1);
            }, 7000);
          }

          switch (progress.value.answer) {
            case 0:
              setAmountOfAnswersRight(prev => prev + 1);
              break;
            case 1:
              setAmountOfAnswersLeft(prev => prev + 1);
              break;
            default:
              break;
          }
        }

        if (progress.property === "game1-distribute") {
          setAmountOfPlayersCompleted(prev => prev + 1);
          
          console.log("GAME1 DISTRIBUTE:", amountOfPlayersCompleted + 1, finished);
          if ((amountOfConnected <= amountOfPlayersCompleted + 1)) {
            // alert(amountOfPlayersCompleted)
            console.log("CLOSING MODAL..., openning win modal")
            openWinModal();
          }
        }

        /*
        if (progress.property === "game1-wait-to-finish") {
          console.log("DISTRIBUTING REWARD...");
          closeWaitingBeforeFinishModal();
          openLoadingModal();
        }
        */

        if (progress.property === "game1-wait-after-finish") {
          console.log("NEXT_CLICKED++")
          setWaitingAfterFinishPlayersCount(prev => prev + 1);
          if (raceData.numberOfPlayersRequired <= waitingAfterFinishPlayersCount + 1) {
            console.log("MOVE FORWARD")
            nextClicked();
          }
        }
      });

      socket.on('race-progress-questions', ({progress}) => {
        console.log("RACE PROGRESS QUESTIONS:", progress);
        let isDistributedAmount = 0;
        let waitingAfterFinishAmount = 0;
        let waitingToFinishAmount = 0;
        let answers: any[] = [];
        progress.forEach((i: any) => {
          if (i.progress.game1.isDistributed) {
            isDistributedAmount++;
          }

          if (i.progress.waitingAfterFinish) {
            waitingAfterFinishAmount++;
          }

          if (i.progress.game1.waitingToFinish) {
            waitingToFinishAmount++;
            answers.push(i.progress.game1.answers);
          }
        });

        console.log({isDistributedAmount, waitingAfterFinishAmount, waitingToFinishAmount});
        setAmountOfPlayersCompleted(isDistributedAmount);
        setWaitingAfterFinishPlayersCount(waitingAfterFinishAmount);
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
  }, [socket, amountOfConnected, smartAccountAddress, finished, amountOfPlayersCompleted, amountOfPlayersRaceboardNextClicked, raceData, waitingAfterFinishPlayersCount, amountOfAnswersLeft, amountOfAnswersRight]);

  // fetch server-side data
  useEffect(() => {
    if (smartAccountAddress && raceData) {
      console.log(">>>>>>>>>>>>>> EFFECT <<<<<<<<<<<<<<<")
      socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
      socket.emit("get-progress-questions", { raceId });
    }
  }, [socket, smartAccountAddress, raceData]); 


  useEffect(() => {
    if(smartAccountAddress && String(raceId).length && raceData) {
        if (!socket.connected) {
          socket.connect();
        }
        socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: "UNDERDOG" });
    }
  }, [smartAccountAddress, socket, raceId, raceData]);


  function nextClicked() {
    socket.emit('minimize-live-game', { part: 'UNDERDOG', raceId });
    navigate(generateLink("RACE_UPDATE_2", Number(raceId)), {
      state: location.state
    });
  }

  // INITIAL USE EFFECT
  useEffect(() => {
    if (smartAccountAddress && progress?.game1 && raceData) {

      const {isDistributed, of, completed, waitingToFinish} = progress.game1;
      
      // continue answering questions
      if (completed != of && completed < of) {
        console.log("CONTINUE FROM", completed);
        setCurrentQuestionIndex(completed);
        return;
      }

      // start waiting other players to finish answering
      if (waitingToFinish) {
        console.log("<<<<<<< INIT <<<<<<<")
        pause();
        onFinish();
        setWaitingToFinishModalPermanentlyOpened(true);
        return;
      }
      
      // user answered all questions but score was not calculated
      if (!waitingToFinish && completed >= of && completed > 0 && of > 0 && !isDistributed) {
        pause();
        setDistributePermanentlyOpened(true);
        return;
      }
    }
  }, [progress?.game1, questionsByGames, smartAccountAddress, raceData]);

  useEffect(() => {
    updateProgress();
  }, []);



  return (
    <div className="relative mx-auto flex h-screen w-full flex-col bg-underdog_bg bg-cover bg-center">
      { 
        (
          (selectedAnswer == "left" && amountOfAnswersLeft < amountOfAnswersRight) ||
          (selectedAnswer == "right" && amountOfAnswersRight < amountOfAnswersLeft)
        ) 
        &&
        (amountOfAnswersLeft + amountOfAnswersRight >= (raceData?.numberOfPlayersRequired || 9)) 
        &&
        <Firework/>
      }
      {(selectedAnswer) && (
        <div className="absolute inset-0 bg-black bg-opacity-50 z-40" />
      )}

      {(selectedAnswer) && (
        <img 
          src={DogLoaderImage} 
          alt="pulse-bg" 
          className="absolute inset-0 z-50 w-full h-full object-cover animate-pulse"
        />
      )}
      
      <div className="relative my-4">
        <Timer seconds={totalSeconds} />
        <div className="absolute right-4 top-0">
          <UserCount currentAmount={amountOfConnected} requiredAmount={raceData?.numberOfPlayersRequired || 9}/>
        </div>
      </div>
      {
        (currentQuestionIndex !== questions.length)
        &&
        <SwipeSelection 
          leftAction={onClickLike}
          rightAction={onClickDislike}
          key={roundId.toString()} 
          ref={ref} 
          onFinish={onFinish} 
          questions={questions.slice(progress?.game1 ? progress.game1.completed : 0, questions.length) || []}
          currentQuestionIndex={currentQuestionIndex}
          disabled={modalIsOpen || submittingAnswer}
          completedCount={progress?.game1?.completed || 0}
        />
      }

      <div className="m-auto mb-0 w-[65%]">
        <SelectionBtnBox
          leftLabel={questions?.[currentQuestionIndex]?.info.answers[0] || ""}
          rightLabel={questions?.[currentQuestionIndex]?.info.answers[1] || ""}
          // const swiped = (direction: Direction, nameToDelete: string, index: number) => {
          leftAction={onClickLike}
          // const swiped = (direction: Direction, nameToDelete: string, index: number) => {
          rightAction={onClickDislike}
          disabled={modalIsOpen || submittingAnswer}
          currentQuestionIndex={currentQuestionIndex}
          selectedAnswer={selectedAnswer}

          amountOfQuestions={questions.length}
          leftCount={amountOfAnswersLeft}
          rightCount={amountOfAnswersRight}
        />
      </div>


      

      {modalIsOpen && (
        <>
          {
            modalType === "loading" && 
            <LoadingModal closeHandler={closeLoadingModal} raceId={Number(raceId)} gameIndex={currentGameIndex} questionIndexes={Array.from(Array(Number(questions.length)).keys())} answers={[]}/>
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
        distributePermanentlyOpened && 
        <LoadingModal closeHandler={closeLoadingModal} raceId={Number(raceId)} gameIndex={currentGameIndex} questionIndexes={Array.from(Array(Number(questions.length)).keys())} answers={[]}/>
      }
      {
        waitingToFinishModalPermanentlyOpened &&
        <WaitingForPlayersModal numberOfPlayers={amountOfConnected} numberOfPlayersRequired={raceData?.numberOfPlayersRequired || 9} replacedText="..."/> 
      }
      {
        winModalPermanentlyOpened && 
        <WinModal handleClose={closeWinModal} raceId={Number(raceId)} gameIndex={currentGameIndex}/>
      }
    </div>
  );
}

export default UnderdogGame;