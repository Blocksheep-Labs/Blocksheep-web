

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
import generateLink from "../../utils/linkGetter";


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
    }
  }

  const handleNavigate = useCallback((progress: any) => {
    console.log("PROGRESS-----------", progress);
    socket.emit('minimize-live-game', { part: 'RACE_SELECTION' });

    /*
    getRaceById(Number(raceId), smartAccountAddress as `0x${string}`).then(data => {
      console.log(generateStateObjectForGame(data, progress))
      navigate(`/race/${raceId}/underdog`, {
        state: generateStateObjectForGame(data, progress)
      });
    });
    return;
    */
    
    const rIdNumber = Number(raceId);
    
    getRaceById(Number(raceId), smartAccountAddress as `0x${string}`).then(data => {

      if (!progress?.story?.intro) {
          navigate(generateLink("STORY_INTRO", rIdNumber), {
            state: generateStateObjectForGame(data, progress, "start")
          });
        return;
      }
      

      if (!progress?.countdown) {
        console.log("COUNTDOWN")
        navigate(generateLink("RACE_START", rIdNumber), {
          state: generateStateObjectForGame(data, progress, "start")
        });
        return;
      }

      // preview underdog game, passing the game state
      if (!progress?.game1_preview) {
        console.log("UNDERDOG PREVIEW");
        navigate(generateLink("UNDERDOG_PREVIEW", rIdNumber), {
          state: generateStateObjectForGame(data, progress, "questions")
        });
        return;
      }

      // rules underdog game, passing the game state
      if (!progress?.game1_rules) {
        console.log("UNDERDOG RULES");
        navigate(generateLink("UNDERDOG_RULES", rIdNumber), {
          state: generateStateObjectForGame(data, progress, "questions")
        });
        return;
      }

      // game 1 was not passed
      if (!progress?.game1?.isDistributed) {
        console.log("UNDERDOG")
        navigate(generateLink("UNDERDOG", rIdNumber), {
          state: generateStateObjectForGame(data, progress, "questions")
        });
        return;
      }

      // countdown 2 (before the first game) was not passed
      if (!progress?.board1) {
        console.log("BOARD-1")
        navigate(generateLink("UNDERDOG", rIdNumber), {
          state: generateStateObjectForGame(data, progress, "board")
        });
        return;
      }

      if (!progress?.nicknameSet) {
        console.log("SET_NICKNAME")
        navigate(generateLink("ADD_NAME", rIdNumber), {
          state: generateStateObjectForGame(data, progress, "board")
        });
        return;
      }

      if (!progress?.story?.part1) {
        navigate(generateLink("STORY_PART_1", rIdNumber), {
          state: generateStateObjectForGame(data, progress, undefined)
        });
        return;
      }
      

      // preview rabbit hole game, passing the game state
      if (!progress?.game2_preview) {
        console.log("RABBIT-HOLE PREVIEW");
        navigate(generateLink("RABBIT_HOLE_PREVIEW", rIdNumber), {
          state: generateStateObjectForGame(data, progress, undefined)
        });
        return;
      }

      // rules rabbit hole game, passing the game state
      if (!progress?.game2_rules) {
        console.log("RABBIT-HOLE RULES");
        navigate(generateLink("RABBIT_HOLE_RULES", rIdNumber), {
          state: generateStateObjectForGame(data, progress, undefined)
        })
        return;
      }

      // user not clicked the 'next' button on win/lose modal of the 2nd game
      if (!progress?.game2.waitingToFinish) {
        console.log("RABBIT-HOLE");
        navigate(generateLink("RABBIT_HOLE", rIdNumber), {
          state: generateStateObjectForGame(data, progress, undefined)
        });
        return;
      }

      
      if (!progress?.story?.part2) {
        navigate(generateLink("STORY_PART_2", rIdNumber), {
          state: generateStateObjectForGame(data, progress, undefined)
        });
        return;
      }
      

      if (!progress?.game3_preview) {
        console.log("BULLRUN PREVIEW");
        navigate(generateLink("BULL_RUN_PREVIEW", rIdNumber), {
          state: generateStateObjectForGame(data, progress, undefined)
        });
        return;
      }

      if (!progress?.game3_rules) {
        console.log("BULLRUN RULES");
        navigate(generateLink("BULL_RUN_RULES", rIdNumber), {
          state: generateStateObjectForGame(data, progress, undefined)
        });
        return;
      }

      if (!progress?.game3.isCompleted) {
        console.log("BULLRUN");
        navigate(generateLink("BULL_RUN", rIdNumber), {
          state: generateStateObjectForGame(data, progress, undefined)
        });
        return;
      }  

      
      if (!progress?.story?.part3) {
        navigate(generateLink("STORY_PART_3", rIdNumber), {
          state: generateStateObjectForGame(data, progress, undefined)
        });
        return;
      }
      
      if (!progress?.story?.game2_v2_preview) {
        navigate(generateLink("RABBIT_HOLE_V2_PREVIEW", rIdNumber), {
          state: generateStateObjectForGame(data, progress, undefined)
        });
        return;
      }

      if (!progress?.story?.game2_v2_rules) {
        navigate(generateLink("RABBIT_HOLE_V2_RULES", rIdNumber), {
          state: generateStateObjectForGame(data, progress, undefined)
        });
        return;
      }

      // user not clicked the 'next' button on win/lose modal of the 2nd game v2
      if (!progress?.game2.waitingToFinish) {
        console.log("RABBIT-HOLE");
        navigate(generateLink("RABBIT_HOLE_V2", rIdNumber), {
          state: generateStateObjectForGame(data, progress, undefined)
        });
        return;
      }

      
      if (!progress?.story?.conclusion) {
        navigate(generateLink("STORY_CONCLUSION", rIdNumber), {
          state: generateStateObjectForGame(data, progress, undefined)
        });
        return;
      }

      if (!progress?.rate) {
        navigate(generateLink("RATE", rIdNumber), {
          state: generateStateObjectForGame(data, progress, undefined)
        });
        return;
      }

      navigate(generateLink("PODIUM", rIdNumber), {
        state: generateStateObjectForGame(data, progress, undefined)
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
          console.log("CONNECTED:", data)
          // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
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
          console.log("JOINED", raceIdSocket, userAddress);
          setAmountOfConnected(amountOfConnected + 1);
          if (amountOfConnected + 1 >= race.numOfPlayersRequired) {
            setIsOpen(false);
            setModalType(undefined);
            handleNavigate(progress);
          }
        }
      });

      socket.on('leaved', ({ raceId: raceIdSocket, part }) => {
        if (raceId == raceIdSocket && part == 'RACE_SELECTION') {
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



  const onClickRegister = useCallback(async(id: number, questionsCount: number) => {
    setIsOpen(true);
    setModalType("registering");
    await registerOnTheRace(id, questionsCount, smartAccountClient, smartAccountAddress).then(_ => {
      console.log("REGISTERED, fetching list of races...");
      fetchAndSetRaces();
      setRaceId(id);
      setIsOpen(true);
      setModalType("registered");
    }).catch(err => {
      setModalType(undefined);
      setIsOpen(false);
      console.log("REG ERR:", err);
    });
  }, [smartAccountAddress]);

  function closeModal() {
    setIsOpen(false);
    setRaceId(null);
  }

  //console.log(races, races.find((r: any) => r.id === raceId))

  return (
    <div className="mx-auto flex h-screen w-full flex-col bg-race_bg bg-cover bg-bottom">
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
