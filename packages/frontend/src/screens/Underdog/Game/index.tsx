// External libraries
import { RefObject, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";

// Components
import UserCount from "@/components/UserCount";
import LoadingModal from "@/components/modals/LoadingModal";
import WinModal from "@/components/modals/WinModal";
import Timer from "@/components/Timer";
import WaitingForPlayersModal from "@/components/modals/WaitingForPlayersModal";
import Firework from "@/components/firework/firework";
import SwipeSelection from "./components/SwipeSelection";
import SelectionBtnBox from "./components/SelectionBtnBox";

// Hooks
import { useSmartAccount } from "@/hooks/smartAccountProvider";
import { useMakeMove } from "@/hooks/useMakeMove";
import { useDistribute } from "@/hooks/useDistribute";
import { useGetUserPoints } from "@/hooks/useGetPoints";
import { useGetRules } from "@/hooks/useGetRules";
import { useRaceById } from "@/hooks/useRaceById";

// Utilities
import { socket } from "@/utils/socketio";
import generateLink, { TFlowPhases } from "@/utils/linkGetter";
import { txAttempts } from "@/utils/txAttempts";
import { build as buildMakeMoveData } from "./arguments-builder/makeMove";
import { build as buildDistributeData } from "./arguments-builder/distribute";

// Assets
import DogLoaderImage from "../assets/background_head.webp";

import LoseTears from "../assets/LoseTears.png";
import WinHat from "../assets/WinHat.png";
import {httpGetRaceDataById} from "@/utils/http-requests";


export interface SwipeSelectionAPI {
  swipeLeft: () => void;
  swipeRight: () => void;
}
const REGISTERED_CONTRACT_NAME = "UNDERDOG";

export type TQuestion = {
  id: number;
  info: {
      imgUrl: string,
      content: string,
      answers: string[],
  }
}

function UnderdogGame() {
  const {smartAccountAddress} = useSmartAccount();
  const navigate = useNavigate();
  // const navigate = (a: string, b?: any) => {}
  const ref: RefObject<SwipeSelectionAPI> = useRef(null);
  const [flipState, setFlipState] = useState(true);
  const {raceId} = useParams();
  const { race: raceData } = useRaceById(Number(raceId));

  // State for modal visibility
  const [modalIsOpen, setIsOpen] = useState(false);
  const [distributePermanentlyOpened, setDistributePermanentlyOpened] = useState(false);
  const [winModalPermanentlyOpened, setWinModalPermanentlyOpened] = useState(false);
  const [waitingToFinishModalPermanentlyOpened, setWaitingToFinishModalPermanentlyOpened] = useState(false);

  // State for game progress and questions
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [questions, setQuestions] = useState<TQuestion[]>([]);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());

  // State for player counts and answers
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [amountOfPlayersCompleted, setAmountOfPlayersCompleted] = useState(0);
  const [amountOfAnswersLeft, setAmountOfAnswersLeft] = useState(0);
  const [amountOfAnswersRight, setAmountOfAnswersRight] = useState(0);
  const [amountOfAnswersUnknwon, setAmountOfAnswersUnknown] = useState(0);
  const [waitingAfterFinishPlayersCount, setWaitingAfterFinishPlayersCount] = useState(0);
  const [addressesCompleted, setAddressesCompleted] = useState<string[]>([]);
  const [answersSubmittedBy, setAnswersSubmittedBy] = useState<string[]>([]);
  const [raceUsersDataColors, setRaceUsersDataColors] = useState<Map<string, number>>(new Map());

  // State for answer selection
  const [selectedAnswer, setSelectedAnswer] = useState<"left" | "right" | "unknown" | null>(null);
  const [hideGameInterface, setHideGameInterface] = useState(false);
  const [latestInteractiveModalWasClosed, setLatestInteractiveModalWasClosed] = useState(false);
  
  const [resultsTimeoutStarted, setResultsTimeoutStarted] = useState(false);

  const { makeMove } = useMakeMove(REGISTERED_CONTRACT_NAME, Number(raceId));
  const { distribute } = useDistribute(REGISTERED_CONTRACT_NAME, Number(raceId));
  const { getPoints } = useGetUserPoints(REGISTERED_CONTRACT_NAME, Number(raceId), String(smartAccountAddress));
  const { getRules } = useGetRules(REGISTERED_CONTRACT_NAME, Number(raceId));

  const navigateToNextScreen = () => {
    const currentScreenIndex = raceData?.screens.indexOf(REGISTERED_CONTRACT_NAME) as number;
    socket.emit('minimize-live-game', { part: REGISTERED_CONTRACT_NAME, raceId });
    navigate(generateLink(raceData?.screens?.[currentScreenIndex + 1] as TFlowPhases, Number(raceId)));
  }
  
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

  useEffect(() => {
    getRules().then(data => {
      // @ts-ignore
      setQuestions(data[0] as any);
    }).catch(console.log);

    httpGetRaceDataById(`race-${raceId}`).then(({data}) => {
      console.log({data});

      setRaceUsersDataColors(new Map(Object.entries(data.race.usersSheeps)));
    });
  }, []);

  // after game finish
  const { totalSeconds: totlaSecondsToMoveNext, restart: restartNextTimer, start: startNextTimer, } = useTimer({
    expiryTimestamp: time,
    autoStart: false,
    onExpire: () => {
      closeWinModal();
    }
  });

  const { totalSeconds, restart, pause, resume } = useTimer({
    expiryTimestamp: time,
    onExpire: () => {
      if (!submittingAnswer) {
        console.log("TIME EXPIRED!")
        setFlipState(!flipState);
        socket.emit('set-questions-state', {
          raceId,
          newIndex: currentQuestionIndex,
          secondsLeft: 0,
          state: "submitting",
        });
        flipState ? onClickLike() : onClickDislike();
      }
    },
  });

  // updates seconds on server
  useEffect(() => {
    if (totalSeconds > 0) {
      socket.emit('set-questions-state', {
        raceId,
        newIndex: currentQuestionIndex,
        secondsLeft: totalSeconds,
        state: "answering",
      });
    }
  }, [totalSeconds]);
  
  const onClickLike = async(sendTx=true) => {
    // Prevent multiple submissions for the same question
    if (submittingAnswer || answeredQuestions.has(currentQuestionIndex)) {
      return;
    }

    setSelectedAnswer("left");
    setSubmittingAnswer(true);
    setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));
    pause();

    console.log("UPDATE PROGRESS", {
      raceId,
      userAddress: smartAccountAddress,
      property: "underdog++",
      value: {
        completed: currentQuestionIndex + 1,
        of: Number(questions.length),
        answer: 1,
      }
    });
    
    sendTx && txAttempts(
      5,
      async() => await makeMove(buildMakeMoveData(currentQuestionIndex, 1, smartAccountAddress as string)),
      3000
    ).catch(err => {
      //console.log(err);
      console.log("Answer can not be submitted, probably answered already");
    }).finally(() => {
      socket.emit('update-progress', {
        raceId,
        userAddress: smartAccountAddress,
        property: "underdog++",
        value: {
          completed: currentQuestionIndex + 1,
          of: Number(questions.length),
          answer: 1,
        }
      });
    });
  };


  const onClickDislike = async(sendTx=true) => {
    // Prevent multiple submissions for the same question
    if (submittingAnswer || answeredQuestions.has(currentQuestionIndex)) {
      return;
    }

    setSelectedAnswer("right");
    setSubmittingAnswer(true);
    setAnsweredQuestions(prev => new Set([...prev, currentQuestionIndex]));
    pause();

    console.log("UPDATE PROGRESS", {
      raceId,
      userAddress: smartAccountAddress,
      property: "underdog++",
      value: {
        completed: currentQuestionIndex + 1,
        of: Number(questions.length),
        answer: 0,
      }
    });

    sendTx && txAttempts(
      5,
      async() => await makeMove(buildMakeMoveData(currentQuestionIndex, 0, smartAccountAddress as string)),
      3000,
    ).catch(err => {
      //console.log(err);
      console.log("Answer can not be submitted, probably answered already");
    }).finally(() => {
      socket.emit('update-progress', {
        raceId,
        userAddress: smartAccountAddress,
        property: "underdog++",
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
    socket.emit('set-questions-state', {
      raceId,
      newIndex: currentQuestionIndex,
      secondsLeft: 0,
      state: "distributing",
    });
    console.log("loading modal opened");
    setIsOpen(true);
    //setModalType("loading");
    setDistributePermanentlyOpened(true);
  }

  function closeLoadingModal() {
    console.log("loading modal closed")
    setDistributePermanentlyOpened(false);
    setIsOpen(false);
    socket.emit("update-progress", {
      raceId,
      userAddress: smartAccountAddress,
      property: "underdog-distribute",
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
    setIsOpen(true);
    console.log("win modal opened");
    socket.emit('set-questions-state', {
      raceId,
      newIndex: currentQuestionIndex,
      secondsLeft: 0,
      state: "distributed",
    });
    setWaitingToFinishModalPermanentlyOpened(false);
    setDistributePermanentlyOpened(false);

    setWinModalPermanentlyOpened(true);
    //setFinished(true);
    pause();

    const time = new Date();
    time.setSeconds(time.getSeconds() + 10);
    restartNextTimer(time);
    startNextTimer();
  }

  function closeWinModal() {
    console.log("win modal closed");
    setWinModalPermanentlyOpened(false);
    setIsOpen(false);
    openWaitingAfterFinishModal();
    pause();
    setLatestInteractiveModalWasClosed(true);
  }


  function openWaitingAfterFinishModal() {
    socket.emit("update-progress", {
      raceId,
      userAddress: smartAccountAddress,
      property: "underdog-wait-after-finish",
    });
    setWaitingToFinishModalPermanentlyOpened(true);
    pause();
  }


  function onFinish() {
    setHideGameInterface(true);
    setInterval(pause, 1000);
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
            property: "underdog-confirm-last-answer",
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
            socket.emit('set-questions-state', {
              raceId,
              newIndex: currentQuestionIndex + 1,
              secondsLeft: totalSeconds,
              state: "answering",
            });
            setCurrentQuestionIndex(currentQuestionIndex + 1);
            // reset time
            const time = new Date();
            time.setSeconds(time.getSeconds() + 10);
            restart(time);
            setAnswersSubmittedBy([]);
          } else {
            onFinish();
          }

        }, 7000);
      }


      socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
        console.log("AMOUNT OF CONNECTED:", amount, raceIdSocket, raceId)
        if (raceId == raceIdSocket) {
          setAmountOfConnected(amount);
        }
      });

      socket.on('joined', ({ raceId: raceIdSocket, userAddress, part }) => {
        if (raceId == raceIdSocket && part == "UNDERDOG") {
          setAmountOfConnected(amountOfConnected + 1);
          socket.emit("get-connected", { raceId });
        }
      });

      socket.on('leaved', ({ part, raceId: raceIdSocket, movedToNext, connectedCount }) => {
        if (part == "UNDERDOG" && raceId == raceIdSocket && !movedToNext) {
          setAmountOfConnected(connectedCount);
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

        if (progress.property == "underdog++") {
          if (answersSubmittedBy.includes(progress.userAddress)) {
            return;
          }

          setAnswersSubmittedBy([...answersSubmittedBy, progress.userAddress]);
          console.log("Submitted answer", progress.value.answer);
                
          // if we have questions amount in sum of answers count
          console.log({amountOfConnected, amount: amountOfAnswersLeft + amountOfAnswersRight + 1})
          if (amountOfAnswersLeft + amountOfAnswersRight + amountOfAnswersUnknwon + 1 >= amountOfConnected) {
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
              setAmountOfAnswersUnknown(prev => prev + 1);
              break;
          }
        }

        if (progress.property === "underdog-distribute") {
          setAmountOfPlayersCompleted(prev => prev + 1);
          
          console.log("GAME1 DISTRIBUTE:", amountOfPlayersCompleted + 1);
          if ((amountOfConnected <= amountOfPlayersCompleted + 1)) {
            console.log("CLOSING MODAL..., openning win modal")
            openWinModal();
          }
        }

        if (progress.property === "underdog-wait-after-finish") {
          console.log("NEXT_CLICKED++")
          setAddressesCompleted([...addressesCompleted, progress.userAddress]);
          setWaitingAfterFinishPlayersCount(prev => prev + 1);
          if (amountOfConnected <= waitingAfterFinishPlayersCount + 1) {
            console.log("MOVE FORWARD")
            navigateToNextScreen();
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
          if (i.progress.underdog.isDistributed) {
            isDistributedAmount++;
          }

          if (i.progress.waitingAfterFinish) {
            // track by addresses to block click next btn
            playersClickedNextAddrs.push(i.userAddress);
            waitingAfterFinishAmount++;
          }

          if (i.progress.underdog.waitingToFinish) {
            waitingToFinishAmount++;
            answers.push(i.progress.underdog.answers);
          }

          if (!i.progress.underdog.lastAnswerIsConfirmed) {
            const answers = i.progress.underdog.answers;
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

        if (amountOfAnswersLeftServer + amountOfAnswersRightServer == raceData.numOfPlayersRequired) {
          console.log({amountOfAnswersLeftServer, amountOfAnswersRightServer})
          socket.emit('underdog-results-shown', { raceId });
          setupTimeout();
        }

        console.log({isDistributedAmount, waitingAfterFinishAmount, waitingToFinishAmount});
        setAmountOfPlayersCompleted(isDistributedAmount);
        setWaitingAfterFinishPlayersCount(waitingAfterFinishAmount);
      });

      socket.on("screen-changed", ({ screen }) => {
        if (raceData.screens.indexOf(screen) > raceData.screens.indexOf(REGISTERED_CONTRACT_NAME)) {
          navigate(generateLink(screen, Number(raceId)));
        }
      });

      socket.on('race-progress', ({ progress, questionsState }) => {
        const {isDistributed, of, completed, waitingToFinish, lastAnswerIsConfirmed, waitingAfterFinish, answers} = progress.progress.underdog;
        
        /*
        // means that the player leaved on pulsating dog screen
        if (!lastAnswerIsConfirmed) {
          setSubmittingAnswer(true);
          setCurrentQuestionIndex(completed - 1);
          return;
        }
        */

        // user answered all questions but score was not calculated
        if (completed >= of && completed > 0 && of > 0 && !isDistributed) {
          pause();
          openLoadingModal();
          return;
        }
        
        console.log({questionsState})
        const { 
          // room, 
          state,
          index, 
          secondsLeft 
        } = questionsState;

        if (index <= 2) {
          console.log("CONTINUE FROM", index);
          setCurrentQuestionIndex(index);

          // no seconds left and submitting an answer
          if (secondsLeft == 0 && state == "submitting") { 
            // not time left, show the pulse dog
            setSelectedAnswer("unknown");
            setSubmittingAnswer(true);
            socket.emit('update-progress', {
              raceId,
              userAddress: smartAccountAddress,
              property: "underdog++",
              value: {
                completed: currentQuestionIndex + 1,
                of: Number(questions.length),
                answer: -1,
              }
            });
            return;
          }

          // questions passed, distributing reward stage
          if (state == "distributing") {
            pause();
            openLoadingModal();
            return;
          }

          // distributed, final modal was opened
          if (state == "distributed") {
            pause();
            openWinModal();
            return;
          }
          
          // continue answering
          const time = new Date();
          time.setSeconds(time.getSeconds() + secondsLeft);
          restart(time);
          return;
        }
      });

      socket.on('questions-state', ({ raceId, data: newState }) => {
        setCurrentQuestionIndex(newState.index);
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
        socket.off('questions-state');
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
    amountOfAnswersUnknwon,
    distributePermanentlyOpened, 
    winModalPermanentlyOpened,
    answersSubmittedBy
  ]);

  // this ensures that connected users will be redirected if someone disconnects on the part of closing the modal
  useEffect(() => {
    if (waitingAfterFinishPlayersCount >= amountOfConnected && waitingAfterFinishPlayersCount > 0 && amountOfConnected > 0) {
      navigateToNextScreen();
    }
  }, [amountOfConnected, waitingAfterFinishPlayersCount]);
  

  // fetch server-side data
  useEffect(() => {
    if (smartAccountAddress && raceData) {
      console.log(">>>>>>>>>>>>>> EFFECT <<<<<<<<<<<<<<<")
      socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
      socket.emit("get-progress-all", { raceId });
    }
  }, [socket, smartAccountAddress, raceData]); 


  useEffect(() => {
    if (raceId && socket && raceData) {
      if (!socket.connected) {
        socket.connect();
      }
      
      socket.on('screen-changed', ({ screen }) => {
        if (raceData.screens.indexOf(screen) > raceData.screens.indexOf(REGISTERED_CONTRACT_NAME)) {
          navigate(generateLink(screen, Number(raceId)));
        }
      });

      socket.on('latest-screen', ({ screen }) => {
        if (raceData.screens.indexOf(screen) > raceData.screens.indexOf(REGISTERED_CONTRACT_NAME)) {
          navigate(generateLink(screen, Number(raceId)));
        }
      });
  
      return () => {
        socket.off('screen-changed');
        socket.off('latest-screen');
      }
    }
  }, [raceId, socket, raceData]);
        
  useEffect(() => {
    if (smartAccountAddress && String(raceId).length && raceData) {
      if (!socket.connected) {
        socket.connect();
      }
      socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: "UNDERDOG" });
      // socket.emit("get-latest-screen", { raceId, part: "UNDERDOG" });
    }
  }, [smartAccountAddress, socket, raceId, raceData]);


    // kick player if page chnages (closes)
    useEffect(() => {
      const handleTabClosing = (e: any) => {
        e.preventDefault();
        socket.disconnect();
      }
      window.addEventListener('unload', handleTabClosing);
      return () => {
        window.removeEventListener('unload', handleTabClosing);
      }
    }, [socket, smartAccountAddress, raceId]);


    console.log({questions})
  return (
    <div className="relative mx-auto flex w-full flex-col bg-underdog_bg bg-cover bg-center" style={{ height: `${window.innerHeight}px` }}>
      {
        (
          (selectedAnswer == "left" && amountOfAnswersLeft < amountOfAnswersRight) ||
          (selectedAnswer == "right" && amountOfAnswersRight < amountOfAnswersLeft)
        ) 
        && 
        (amountOfAnswersLeft + amountOfAnswersRight >= (raceData?.numOfPlayersRequired || 9)) 
          &&  
          <>
            <Firework/>
            <img src={WinHat} alt="WinHat" className="absolute w-[230px] h-[158px] top-[0px] right-1/2 translate-x-[53%]"/>
          </>
      }

      {
          !(
            (selectedAnswer == "left" && amountOfAnswersLeft < amountOfAnswersRight) ||
            (selectedAnswer == "right" && amountOfAnswersRight < amountOfAnswersLeft)
          ) &&
          (amountOfAnswersLeft + amountOfAnswersRight >= (raceData?.numOfPlayersRequired || 9)) 
          ? (
            <div className="tears z-50 absolute w-[198px] h-[150px] top-[148px] right-1/2 translate-x-[50%]">
              <img src={LoseTears} alt="LoseTears" className="w-full h-full"/>
            </div>
          )
          : null
      }

      {/* Only show pulsive overlay if selectedAnswer is true, and LoseTears/Firework aren't shown */}
      {
        selectedAnswer && 
        !(
          (selectedAnswer == "left" && amountOfAnswersLeft < amountOfAnswersRight) ||
          (selectedAnswer == "right" && amountOfAnswersRight < amountOfAnswersLeft)
        ) && 
        !(amountOfAnswersLeft + amountOfAnswersRight >= (raceData?.numOfPlayersRequired || 9)) 
        ? (
          <>
            <div className="absolute inset-0 bg-black bg-opacity-50 z-40" />
            <img 
              src={DogLoaderImage} 
              alt="pulse-bg" 
              className="absolute inset-0 z-50 w-full h-full object-cover animate-pulse"
            />
          </>
        ) : null
      }
      
      <div className="relative my-4">
        {!submittingAnswer && !modalIsOpen && <Timer seconds={totalSeconds} />}
        <div className="absolute right-4 top-0">
          <UserCount currentAmount={amountOfConnected} requiredAmount={raceData?.numOfPlayersRequired || 9}/>
        </div>
      </div>
      {
        (currentQuestionIndex !== questions.length && !modalIsOpen && !hideGameInterface)
        &&
        <SwipeSelection 
          leftAction={onClickLike}
          rightAction={onClickDislike}
          ref={ref} 
          onFinish={onFinish} 
          questions={questions}
          currentQuestionIndex={currentQuestionIndex}
          disabled={modalIsOpen || submittingAnswer}
          answeredQuestions={answeredQuestions}
        />
      }

      {
        !hideGameInterface &&
        <div className="m-auto mb-0 w-[65%] z-50">
          <SelectionBtnBox
            leftLabel={questions?.[currentQuestionIndex]?.info.answers[0] || ""}
            rightLabel={questions?.[currentQuestionIndex]?.info.answers[1] || ""}
            leftAction={onClickLike}
            rightAction={onClickDislike}
            disabled={modalIsOpen || submittingAnswer}
            selectedAnswer={selectedAnswer}
            leftCount={amountOfAnswersLeft}
            rightCount={amountOfAnswersRight}
            userSelectedSheepIndex={raceUsersDataColors.get(smartAccountAddress as string) || 0}
          />
        </div>
      }
      
      {
        distributePermanentlyOpened && 
        <LoadingModal 
          distributeFunction={() => distribute(buildDistributeData())}
          closeHandler={closeLoadingModal} 
        />
      }

      {
        waitingToFinishModalPermanentlyOpened && !latestInteractiveModalWasClosed &&
        <WaitingForPlayersModal numberOfPlayers={amountOfConnected} numberOfPlayersRequired={raceData?.numOfPlayersRequired || 9} replacedText="..."/> 
      }

      {
        winModalPermanentlyOpened && !latestInteractiveModalWasClosed &&
        <WinModal 
          raceId={Number(raceId)}
          secondsLeft={totlaSecondsToMoveNext}
          handleClose={closeWinModal} 
          getScoreOfTheUser={getPoints}
        />
      }
    </div>
  );
}

export default UnderdogGame;