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
import { GameState, useGameContext } from "../../utils/game-context";

export interface SwipeSelectionAPI {
  swipeLeft: () => void;
  swipeRight: () => void;
}


type ModalType = "ready" | "loading" | "win" | "race" | "waiting" | "waiting-after-finish" | "waiting-before-finish";

function UnderdogGame() {
  const {smartAccountAddress} = useSmartAccount();
  const navigate = useNavigate();
  const ref: RefObject<SwipeSelectionAPI> = useRef(null);
  const [modalType, setModalType] = useState<ModalType | undefined>(undefined);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [flipState, setFlipState] = useState(true);
  const {raceId} = useParams();
  const {gameState} = useGameContext();
  const [currentGameIndex, setCurrentGameIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [distributePermanentlyOpened, setDistributePermanentlyOpened] = useState(false);
  const [waitingToFinishModalPermanentlyOpened, setWaitingToFinishModalPermanentlyOpened] = useState(false);
  const [winModalPermanentlyOpened, setWinModalPermanentlyOpened] = useState(false);

  const [waitingAfterFinishPlayersCount, setWaitingAfterFinishPlayersCount] = useState(0);
  const questions = gameState?.questionsByGames[currentGameIndex];
  const { questionsByGames, progress } = gameState as GameState;

  const [amountOfConnected, setAmountOfConnected] = useState(0);
  //const [finished, setFinished] = useState(questions.length <= progress?.game1?.completed || false);
  const [amountOfPlayersCompleted, setAmountOfPlayersCompleted] = useState(0);
  const { smartAccountClient } = useSmartAccount();
  const [raceData, setRaceData] = useState<any>(undefined);

  const [selectedAnswer, setSelectedAnswer] = useState<"left" | "right" | null>(null);
  const [amountOfAnswersLeft, setAmountOfAnswersLeft] = useState(0);
  const [amountOfAnswersRight, setAmountOfAnswersRight] = useState(0);
  const [resultsTimeoutStarted, setResultsTimeoutStarted] = useState(false);
  const [addressesCompleted, setAddressesCompleted] = useState<string[]>([]);

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
    //setFinished(true);
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
      const setupTimeout = () => {
        console.log("Setting timeout...");
        setResultsTimeoutStarted(true);
        setTimeout(() => {
          console.log("Timeout, next question >>>")
          socket.emit("update-progress", {
            raceId,
            userAddress: smartAccountAddress,
            property: "game1-confirm-last-answer",
          });
          setSubmittingAnswer(false);
          
          if (selectedAnswer == "right") {
            ref?.current?.swipeRight();
          } else {
            ref?.current?.swipeLeft();
          }
          
          setResultsTimeoutStarted(false);
          setSelectedAnswer(null);
          setAmountOfAnswersLeft(0);
          setAmountOfAnswersRight(0);

          if (currentQuestionIndex !== questions.length - 1) {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            // reset time
            const time = new Date();
            time.setSeconds(time.getSeconds() + 10);
            restart(time);
          } else {
            onFinish();
          }

        }, 7000);
      }


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

          // handle player join on distribute part
          if (distributePermanentlyOpened) {
            return;
          }

          // handle player join on win part
          if (winModalPermanentlyOpened) {
            return;
          }

          const time = new Date();
          time.setSeconds(time.getSeconds() + 10);
          restart(time);
          
          if (amountOfConnected + 1 >= raceData.numberOfPlayersRequired) {
            //updateProgress();
            setIsOpen(false);
            setModalType(undefined);
          }
          socket.emit("get-connected", { raceId });
        }
      });

      socket.on('leaved', ({ part, raceId: raceIdSocket, movedToNext }) => {
        if (part == "UNDERDOG" && raceId == raceIdSocket && !movedToNext) {
          setAmountOfConnected(amountOfConnected - 1);
          pause();

          // handle player leave on distribute part
          if (distributePermanentlyOpened) {
            return;
          }

          // handle player leave on win part
          if (winModalPermanentlyOpened) {
            return;
          }

          setIsOpen(true);
          setModalType("waiting");
        }
      });

      socket.on('underdog-results-shown-on-client', ({ raceId: raceIdSocket }) => {
        console.log("results shown on client", { raceIdSocket, resultsTimeoutStarted, raceIdCheck: raceId == raceIdSocket });
        if (raceId == raceIdSocket && !resultsTimeoutStarted) {
          setupTimeout();
        }
      });

      socket.on("progress-updated", async(progress) => {
        if (progress.raceId != raceId) {
          return;
        }
        console.log("PROGRESS UPDATED SOCKET EVENT:", progress)

        if (progress.property == "game1++") {
          console.log("Submitted answer", progress.value.answer);
                
          // if we have questions amount in sum of answers count
          // TODO: HANDLE SOCKET EVENT (SETTING TIMEOUT)
          if (amountOfAnswersLeft + amountOfAnswersRight + 1 == raceData.numberOfPlayersRequired) {
            socket.emit('underdog-results-shown', { raceId });
            setupTimeout();
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
          
          console.log("GAME1 DISTRIBUTE:", amountOfPlayersCompleted + 1);
          if ((amountOfConnected <= amountOfPlayersCompleted + 1)) {
            console.log("CLOSING MODAL..., openning win modal")
            openWinModal();
          }
        }

        if (progress.property === "game1-wait-after-finish") {
          console.log("NEXT_CLICKED++")
          setAddressesCompleted([...addressesCompleted, progress.userAddress]);
          setWaitingAfterFinishPlayersCount(prev => prev + 1);
          if (raceData.numberOfPlayersRequired <= waitingAfterFinishPlayersCount + 1) {
            console.log("MOVE FORWARD")
            nextClicked();
          }
        }
      });

      socket.on('race-progress-all', ({progress}) => {
        console.log("RACE PROGRESS QUESTIONS:", progress);
        let isDistributedAmount = 0;
        let waitingAfterFinishAmount = 0;
        let waitingToFinishAmount = 0;
        let answers: any[] = [];

        let amountOfAnswersLeftServer = 0;
        let amountOfAnswersRightServer = 0;
        const playersClickedNextAddrs: string[] = [];

        progress.forEach((i: any) => {
          if (i.progress.game1.isDistributed) {
            isDistributedAmount++;
          }

          if (i.progress.waitingAfterFinish) {
            // track by addresses to block click next btn
            playersClickedNextAddrs.push(i.userAddress);
            waitingAfterFinishAmount++;
          }

          if (i.progress.game1.waitingToFinish) {
            waitingToFinishAmount++;
            answers.push(i.progress.game1.answers);
          }

          if (!i.progress.game1.lastAnswerIsConfirmed) {
            const answers = i.progress.game1.answers;
            if (answers.length) {
              const lastAnswer = Number(answers[answers.length - 1]);

              if (lastAnswer == 1) {
                amountOfAnswersLeftServer++;
              } else {
                amountOfAnswersRightServer++;
              }

              if (i.userAddress == smartAccountAddress) {
                setSelectedAnswer(lastAnswer == 1 ? "left" : "right");
              }
            }
          }
        });

        setAddressesCompleted(playersClickedNextAddrs);
        setAmountOfAnswersLeft(amountOfAnswersLeftServer);
        setAmountOfAnswersRight(amountOfAnswersRightServer);

        if (amountOfAnswersLeftServer + amountOfAnswersRightServer == raceData.numberOfPlayersRequired) {
          console.log({amountOfAnswersLeftServer, amountOfAnswersRightServer})
          socket.emit('underdog-results-shown', { raceId });
          setupTimeout();
        }

        console.log({isDistributedAmount, waitingAfterFinishAmount, waitingToFinishAmount});
        setAmountOfPlayersCompleted(isDistributedAmount);
        setWaitingAfterFinishPlayersCount(waitingAfterFinishAmount);
      });

      socket.on("screen-changed", ({ screen }) => {
        navigate(generateLink(screen, Number(raceId)));
      });
  
      return () => {
        socket.off('joined');
        socket.off('amount-of-connected');
        socket.off('leaved');
        socket.off('race-progress');
        socket.off('progress-updated');
        socket.off('race-progress-all');
        socket.off('underdog-results-shown-on-client');
        socket.off('screen-changed');
      }
    }
  }, [
    socket, 
    amountOfConnected, 
    smartAccountAddress, 
    amountOfPlayersCompleted, 
    raceData, 
    waitingAfterFinishPlayersCount, 
    amountOfAnswersLeft, 
    amountOfAnswersRight, 
    distributePermanentlyOpened, 
    winModalPermanentlyOpened
  ]);

  // fetch server-side data
  useEffect(() => {
    if (smartAccountAddress && raceData) {
      console.log(">>>>>>>>>>>>>> EFFECT <<<<<<<<<<<<<<<")
      socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
      socket.emit("get-progress-all", { raceId });
    }
  }, [socket, smartAccountAddress, raceData]); 


  useEffect(() => {
    if(smartAccountAddress && String(raceId).length && raceData) {
        if (!socket.connected) {
          socket.connect();
        }
        socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: "UNDERDOG" });
        socket.emit("get-latest-screen", { raceId, part: "UNDERDOG" });
    }
  }, [smartAccountAddress, socket, raceId, raceData]);


  function nextClicked() {
    socket.emit('minimize-live-game', { part: 'UNDERDOG', raceId });
    navigate(generateLink("RACE_UPDATE_2", Number(raceId)));
  }

  // INITIAL USE EFFECT
  useEffect(() => {
    if (smartAccountAddress && progress?.game1 && raceData) {

      const {isDistributed, of, completed, waitingToFinish, lastAnswerIsConfirmed, answers} = progress.game1;

      // means that the player leaved on pulsating dog screen
      if (!lastAnswerIsConfirmed) {
        setSubmittingAnswer(true);
        setCurrentQuestionIndex(completed - 1);
        
        return;
      }
      

      // continue answering questions
      if (completed != of && completed < of) {
        console.log("CONTINUE FROM", completed);
        setCurrentQuestionIndex(completed);
        return;
      }


      // start waiting other players to finish answering
      /*
      if (waitingToFinish) {
        console.log("<<<<<<< INIT <<<<<<<")
        pause();
        onFinish();
        setWaitingToFinishModalPermanentlyOpened(true);
        return;
      }
      */
      
      // user answered all questions but score was not calculated
      if (completed >= of && completed > 0 && of > 0 && !isDistributed) {
        pause();
        openLoadingModal();
        return;
      }

      pause();
      openWinModal();
    }
  }, [progress?.game1, questionsByGames, smartAccountAddress, raceData]);

  useEffect(() => {
    updateProgress();
  }, []);



  return (
    <div className="relative mx-auto flex w-full flex-col bg-underdog_bg bg-cover bg-center" style={{ height: `${window.innerHeight}px` }}>
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
        {!submittingAnswer && <Timer seconds={totalSeconds} />}
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
        <WinModal handleClose={closeWinModal} raceId={Number(raceId)} gameIndex={currentGameIndex} gameName="underdog"/>
      }
    </div>
  );
}

export default UnderdogGame;