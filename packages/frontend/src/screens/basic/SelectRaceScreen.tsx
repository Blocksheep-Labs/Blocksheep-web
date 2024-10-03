

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

  const generateStateObjectForGame = (data: any, progress: any, nextUrl: string, step?: "questions" | "board" | "start") => {
    return {
      questionsByGames: data.questionsByGames, 
      amountOfRegisteredUsers: data.registeredUsers.length, 
      progress,
      step,
      nextUrl,
    }
  }

  const handleNavigate = useCallback((progress: any) => {
    console.log("PROGRESS-----------", progress);

    
    getRaceById(Number(raceId), smartAccountAddress as `0x${string}`).then(data => {
      navigate(`/race/${raceId}/rabbit-hole/rules`, {
        state: generateStateObjectForGame(data, progress, '/', undefined)
      });
    });
    return;
    
    
    
    getRaceById(Number(raceId), smartAccountAddress as `0x${string}`).then(data => {
      /*
      if (!progress?.story?.intro) {
          navigate(`/race/${raceId}/story/intro`, {
            state: generateStateObjectForGame(data, progress, `/race/${raceId}/countdown`, "start")
          });
        return;
      }
      */

      if (!progress?.countdown) {
        console.log("COUNTDOWN")
        navigate(`/race/${raceId}/countdown`, {
          state: generateStateObjectForGame(data, progress, `/race/${raceId}/underdog/preview`, "start")
        });
        return;
      }

      // preview underdog game, passing the game state
      if (!progress?.game1_preview) {
        console.log("UNDERDOG PREVIEW");
        navigate(`/race/${raceId}/underdog/preview`, {
          state: generateStateObjectForGame(data, progress, `/race/${raceId}/underdog/rules`, "questions")
        });
        return;
      }

      // rules underdog game, passing the game state
      if (!progress?.game1_rules) {
        console.log("UNDERDOG RULES");
        navigate(`/race/${raceId}/underdog/rules`, {
          state: generateStateObjectForGame(data, progress, `/race/${raceId}/underdog`, "questions")
        });
        return;
      }

      // game 1 was not passed
      if (!progress?.game1?.isDistributed) {
        console.log("UNDERDOG")
        navigate(`/race/${raceId}/underdog`, {
          state: generateStateObjectForGame(data, progress, `/race/${raceId}/story/part1`, "questions")
        });
        return;
      }

      // countdown 2 (before the first game) was not passed
      if (!progress?.board1) {
        console.log("BOARD-1")
        navigate(`/race/${raceId}/underdog`, {
          state: generateStateObjectForGame(data, progress, `/race/${raceId}/story/part1`, "board")
        });
        return;
      }

      /*
      if (!progress?.story?.part1) {
        navigate(`/race/${raceId}/story/part1`, {
          state: generateStateObjectForGame(data, progress, `/race/${raceId}/rabbit-hole/preview`, "start")
        });
        return;
      }
      */

      // preview rabbit hole game, passing the game state
      if (!progress?.game2_preview) {
        console.log("RABBIT-HOLE PREVIEW");
        navigate(`/race/${raceId}/rabbit-hole/preview`, {
          state: generateStateObjectForGame(data, progress, `/race/${raceId}/rabbit-hole/rules`, undefined)
        });
        return;
      }

      // rules rabbit hole game, passing the game state
      if (!progress?.game2_rules) {
        console.log("RABBIT-HOLE RULES");
        navigate(`/race/${raceId}/rabbit-hole/rules`, {
          state: generateStateObjectForGame(data, progress, `/race/${raceId}/rabbit-hole`, undefined)
        })
        return;
      }

      // user not clicked the 'next' button on win/lose modal of the 2nd game
      if (!progress?.game2.waitingToFinish) {
        console.log("RABBIT-HOLE");
        navigate(`/race/${raceId}/rabbit-hole`, {
          state: generateStateObjectForGame(data, progress, `/race/${raceId}/story/part2`, undefined)
        });
        return;
      }

      /*
      if (!progress?.story?.part2) {
        navigate(`/race/${raceId}/story/part2`, {
          state: generateStateObjectForGame(data, progress, `/race/${raceId}/bullrun/preview`, "start")
        });
        return;
      }
      */

      if (!progress?.game3_preview) {
        console.log("BULLRUN PREVIEW");
        navigate(`/race/${raceId}/bullrun/preview`, {
          state: generateStateObjectForGame(data, progress, `/race/${raceId}/bullrun/rules`, undefined)
        });
        return;
      }

      if (!progress?.game3_rules) {
        console.log("BULLRUN RULES");
        navigate(`/race/${raceId}/bullrun/rules`, {
          state: generateStateObjectForGame(data, progress, `/race/${raceId}/bullrun`, undefined)
        });
        return;
      }

      if (!progress?.game3.isCompleted) {
        console.log("BULLRUN");
        navigate(`/race/${raceId}/bullrun`, {
          state: generateStateObjectForGame(data, progress, `/race/${raceId}/story/part3`, undefined)
        });
        return;
      }  

      /*
      if (!progress?.story?.part3) {
        navigate(`/race/${raceId}/story/part3`, {
          state: generateStateObjectForGame(data, progress, `/race/${raceId}/story/conclusion`, "start")
        });
      }
      */


      // TODO: RABBIT HOLE V2 MUST BE HERE

      /*
      if (!progress?.story?.conclusion) {
        navigate(`/race/${raceId}/story/conclusion`, {
          state: generateStateObjectForGame(data, progress, `race/${raceId}/stats`, "start")
        });
      }
      */
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

      socket.on('leaved', () => {
        setAmountOfConnected(amountOfConnected - 1);
        if (!modalIsOpen) {
          setIsOpen(true);
        }
        setModalType("waiting");
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
    if (!socket.connected) {
      socket.connect();
    }
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
    <div className="mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom">
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
