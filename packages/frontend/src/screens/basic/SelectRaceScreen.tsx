

import { useCallback, useEffect, useMemo, useState } from "react";
import RibbonLabel from "../../components/RibbonLabel";
import RaceItem from "../../components/race-item/RaceItem";
// import { useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
// import { BLOCK_SHEEP_CONTRACT } from "../constants";
// import BlockSheep from "../contracts/BlockSheep";
// import { Race } from "../types";
import { useNavigate } from "react-router-dom";
import { getRaceById, getRacesWithPagination, registerOnTheRace, retreiveCOST } from "../../utils/contract-functions";
import RegisteringModal from "../../components/modals/RegisteringModal";
import RegisteredModal from "../../components/modals/RegisteredModal";
import { socket } from "../../utils/socketio";
import WaitingForPlayersModal from "../../components/modals/WaitingForPlayersModal";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import generateLink, { TFlowPhases } from "../../utils/linkGetter";
import TopPageTimer from "../../components/top-page-timer/TopPageTimer";
import LazyImage from "../../components/image-loading/lazy-image";
import TinderCard from "react-tinder-card";
import TopScreenMessage from "../../components/top-screen-message/top-screen-message";


function SelectRaceScreen() {
  const { smartAccountClient, smartAccountAddress } = useSmartAccount();
  const navigate = useNavigate();

  const [races, setRaces] = useState<any[]>([]);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [raceId, setRaceId] = useState<number | null>(null);
  const [cost, setCost] = useState(0);
  const [modalType, setModalType] = useState<"registering" | "registered" | "waiting" | undefined>(undefined);
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [progress, setProgress] = useState<any>(null);

  const generateStateObjectForGame = (data: any, progress: any, step?: "questions" | "board" | "start") => {
    return {
      questionsByGames: data.questionsByGames, 
      amountOfRegisteredUsers: data.registeredUsers.length, 
      progress,
      step,
      raceProgressVisual: [],
    }
  }

  const handleNavigate = useCallback((progress: any) => {
    console.log("NAVIGATE", amountOfConnected);
    console.log("PROGRESS-----------", progress);
    socket.emit('minimize-live-game', { part: 'RACE_SELECTION', raceId });
    
    /*
    getRaceById(Number(raceId), smartAccountAddress as `0x${string}`).then(data => {
      console.log(generateStateObjectForGame(data, progress))
      navigate(`/race/${raceId}/race-update/board1`, {
        state: generateStateObjectForGame(data, progress),
        replace: true,
      });
    });
    return;
    */
    
    
    const rIdNumber = Number(raceId);
    
    getRaceById(Number(raceId), smartAccountAddress as `0x${string}`).then(data => {

      const navigationSteps: { check: boolean, link: TFlowPhases, step?: "questions" | "board" | "start" }[] = [
        { 
          check: !progress?.story?.intro, 
          link: "STORY_INTRO", 
          step: "start" 
        },
        { 
          check: !progress?.countdown, 
          link: "RACE_START", 
          step: "start" 
        },
        { 
          check: !progress?.game1_preview, 
          link: "UNDERDOG_PREVIEW", 
          step: "questions" 
        },
        { 
          check: !progress?.game1_rules, 
          link: "UNDERDOG_RULES", 
          step: "questions" 
        },
        { 
          check: !progress?.game1?.isDistributed, 
          link: "UNDERDOG", 
          step: "questions" 
        },
        { 
          check: !progress?.nicknameSet, 
          link: "ADD_NAME", 
          step: "board" 
        },
        { 
          check: !progress?.board1, 
          link: "RACE_UPDATE_1", 
        },
        { 
          check: !progress?.story?.part1, 
          link: "STORY_PART_1" 
        },
        { 
          check: !progress?.game2_preview, 
          link: "RABBIT_HOLE_PREVIEW" 
        },
        { 
          check: !progress?.game2_rules, 
          link: "RABBIT_HOLE_RULES" 
        },
        { 
          check: !progress?.game2.waitingToFinish, 
          link: "RABBIT_HOLE" 
        },
        { 
          check: !progress?.board2, 
          link: "RACE_UPDATE_2",
        },
        { 
          check: !progress?.story?.part2, 
          link: "STORY_PART_2" 
        },
        { 
          check: !progress?.game3_preview, 
          link: "BULL_RUN_PREVIEW" 
        },
        { 
          check: !progress?.game3_rules, 
          link: "BULL_RUN_RULES" 
        },
        { 
          check: !progress?.game3.isCompleted, 
          link: "BULL_RUN" 
        },
        { 
          check: !progress?.board3, 
          link: "RACE_UPDATE_3",
        },
        { 
          check: !progress?.story?.part3, 
          link: "STORY_PART_3" 
        },
        { 
          check: !progress?.story?.game2_v2_preview, 
          link: "RABBIT_HOLE_V2_PREVIEW" 
        },
        { 
          check: !progress?.story?.game2_v2_rules, 
          link: "RABBIT_HOLE_V2_RULES" 
        },
        { 
          check: !progress?.game2.waitingToFinish, 
          link: "RABBIT_HOLE_V2" 
        },
        { 
          check: !progress?.board4, 
          link: "RACE_UPDATE_4",
        },
        { 
          check: !progress?.story?.part4, 
          link: "STORY_PART_4"
        },
        { 
          check: !progress?.rate, 
          link: "RATE" 
        },
        { 
          check: !progress?.story?.conclusion, 
          link: "STORY_CONCLUSION" 
        },
      ];
  
      for (const step of navigationSteps) {
        if (step.check) {
          navigate(generateLink(step.link, rIdNumber), {
            state: generateStateObjectForGame(data, progress, step?.step),
            replace: true,
          });
          return;
        }
      }
  
      // If no conditions met, navigate to PODIUM
      navigate(generateLink("PODIUM", rIdNumber), {
        state: generateStateObjectForGame(data, progress, undefined),
        replace: true,
      });
    });
  }, [raceId]);

  const fetchAndSetRaces = useCallback(async() => {
    if (smartAccountAddress) {
      getRacesWithPagination(smartAccountAddress as `0x${string}`, 0).then(data => {
        setRaces(data as any[]);
      });
      setCost(Number(await retreiveCOST()));
    }
  }, [smartAccountAddress]);
  
  useEffect(() => {
    if (smartAccountAddress) {
      fetchAndSetRaces();
      
      const intId = setInterval(() => {
        fetchAndSetRaces();
      }, 5000);

      return () => {
        clearInterval(intId);
      }
    }
  }, [smartAccountAddress]);

  const selectedRace = useMemo(() => {
    if (!races) {
      return undefined;
    }
    return races.find(({ id }) => id === raceId);
  }, [races, raceId]);

  useEffect(() => {
    if (smartAccountAddress) {
      socket.once('race-progress', ({progress}) => {
        console.log("PROGRESS SET", progress?.progress)
        progress?.progress && setProgress(progress.progress);
      });


      socket.on('amount-of-connected', (data) => {
        if (data.raceId == raceId) {
          const race = races.find((r: any) => r.id === raceId);
          setAmountOfConnected(data.amount);
          console.log("CONNECTED:", data);
          setIsOpen(true);
          setModalType("waiting");
          // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
          console.log(data.amount === race.numOfPlayersRequired, race.numOfPlayersRequired)
          if (data.amount === race.numOfPlayersRequired) {
            setIsOpen(false);
            setModalType(undefined);
            handleNavigate(progress);
          }
        }
      });
      
      socket.on('joined', ({ raceId: raceIdSocket, userAddress }) => {
        console.log(raceIdSocket, raceId)
        const race = races.find((r: any) => r.id === raceId);
        console.log(race);
        if (raceIdSocket == raceId) {
          console.log("JOINED++", raceIdSocket, userAddress);
          setAmountOfConnected(amountOfConnected + 1);
          if (amountOfConnected + 1 >= race.numOfPlayersRequired) {
            setIsOpen(false);
            setModalType(undefined);
          }
          socket.emit("get-connected", { raceId });
        }
      });

      socket.on('leaved', ({ raceId: raceIdSocket, part, movedToNext }) => {
        console.log("LEAVED", { raceId: raceIdSocket, part, movedToNext })
        if (raceId == raceIdSocket && part == 'RACE_SELECTION' && !movedToNext) {
          setAmountOfConnected(amountOfConnected - 1);

          if (!modalIsOpen) {
            setIsOpen(true);
          }
          setModalType("waiting");
        }
      });
  
      return () => {
        socket.off('joined');
        socket.off('amount-of-connected');
        socket.off('leaved');
        socket.off('race-progress');
      }
    }
  }, [socket, raceId, smartAccountAddress, amountOfConnected, progress])

  const onClickJoin = useCallback((id: number) => {
    socket.connect();
    
    if (smartAccountAddress) {
      socket.emit("get-progress", { raceId: id, userAddress: smartAccountAddress });
      setTimeout(() => {
        socket.emit("connect-live-game", { raceId: id, userAddress: smartAccountAddress });
        socket.emit("get-connected", { raceId: id });
      }, 500);
    } 
    setRaceId(id);
    setIsOpen(true);
    setModalType("waiting");
  }, [smartAccountAddress, socket]);

  useEffect(() => {
    if (socket && raceId !== null && smartAccountAddress) {
      const handler = () => {
        if (document.hidden) {
          console.log('Tab is hidden, browser might be going idle.');
          socket.emit('minimize-live-game', { part: 'RACE_SELECTION', raceId });
        } else {
          console.log('Tab is active.');
          socket.connect();
          if (smartAccountAddress) {
            socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
            setTimeout(() => {
              socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress });
              socket.emit("get-connected", { raceId });
            }, 500);
          } 
        }
      }

      document.addEventListener('visibilitychange', handler);
  
      return () => {
        document.removeEventListener('visibilitychange', handler);
      } 
    }
  }, [raceId, socket, smartAccountAddress]);

  const onClickRegister = useCallback(async(id: number, questionsCount: number) => {
    setIsOpen(true);
    setModalType("registering");
    await registerOnTheRace(id, questionsCount, smartAccountClient, smartAccountAddress).then(async _ => {
      console.log("REGISTERED, fetching list of races...");

      setTimeout(async() => {
        try {
          const raceData = await getRaceById(Number(raceId), smartAccountAddress as `0x${string}`);
          
          fetchAndSetRaces();
    
          if (!raceData.registeredUsers.includes(smartAccountAddress)) {
            throw new Error("Registration error, user is not in a list of registered users")
          };
    
          setRaceId(id);
          setIsOpen(true);
          setModalType("registered");
        } catch (error) {
          setModalType(undefined);
          setIsOpen(false);
          console.log(error);
        }
      }, 5000);
    }).catch(err => {
      setModalType(undefined);
      setIsOpen(false);
      console.log("REG ERR:", err);
    });
  }, [smartAccountAddress]);

  function closeModal() {
    onClickJoin(raceId as number);
  }

  //console.log(races, races.find((r: any) => r.id === raceId))

  return (
    <div className="mx-auto flex h-screen w-full flex-col bg-race_bg bg-cover bg-bottom">
      {
        // <TopScreenMessage/>
      }
      <div className="mt-16 flex w-full justify-center">
        <RibbonLabel text="Races"/>
      </div>
      <div className="mx-8 my-4 flex h-3/5 flex-col gap-28 overflow-y-auto pt-28 items-center">
        {races &&
          races.map((r, i) => (
            <RaceItem
              key={i.toString()}
              cost={cost}
              race={r}
              onClickJoin={onClickJoin}
              onClickRegister={onClickRegister}
            />
          ))}
      </div>
      { modalIsOpen && modalType === "waiting" && <WaitingForPlayersModal numberOfPlayers={amountOfConnected} numberOfPlayersRequired={races.find((r: any) => r.id === raceId)?.numOfPlayersRequired || 9}/> }
      { modalIsOpen && modalType === "registering" && <RegisteringModal/> }
      { modalIsOpen && modalType === "registered"  && <RegisteredModal handleClose={closeModal} timeToStart={(() => {
          const dt = new Date(Number(selectedRace?.startAt) * 1000);
          const h = dt.getHours();
          const m = dt.getMinutes();
          const s = dt.getSeconds();
          return `${h < 10 ? `0${h}` : h}:${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`
        })()}/>  
      }
    </div>
  );
}

export default SelectRaceScreen;
