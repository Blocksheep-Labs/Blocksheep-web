

import { useCallback, useEffect, useMemo, useState } from "react";
import RibbonLabel from "../components/RibbonLabel";
import RaceItem from "../components/RaceItem";
// import { useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
// import { BLOCK_SHEEP_CONTRACT } from "../constants";
// import BlockSheep from "../contracts/BlockSheep";
// import { Race } from "../types";
import { useNavigate } from "react-router-dom";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { getRaceById, getRacesWithPagination, registerOnTheRace, retreiveCOST } from "../utils/contract-functions";
import RegisteringModal from "../components/RegisteringModal";
import RegisteredModal from "../components/RegisteredModal";
import { socket } from "../utils/socketio";
import WaitingForPlayersModal from "../components/WaitingForPlayersModal";
import { useSmartAccount } from "../hooks/smartAccountProvider";


const AMOUNT_OF_PLAYERS_PER_RACE = 2;

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

  const handleNavigate = useCallback((progress: any) => {
    console.log("PROGRESS-----------", progress);

    /*
    navigate(`/race/${raceId}/tunnel`, {
      state: {
        stage: progress?.game2?.stage || 0,
        fuel: progress?.game2?.fuel || 0
      }
    });
    return;
    */
    
    if (!progress?.countdown) {
      console.log("COUNTDOWN")
      navigate(`/countdown/${raceId}`);
      return;
    }

    // game 1 was not passed
    if (!progress?.game1?.isDistributed) {
      console.log("GAME-1")
      getRaceById(Number(raceId), smartAccountAddress as `0x${string}`).then(data => {
        navigate(`/race/${raceId}/${data.questionsByGames.length}/${data.gamesCompletedPerUser.length}/questions`, {
          state: {
            questionsByGames: data.questionsByGames, 
            amountOfRegisteredUsers: data.registeredUsers.length, 
            progress,
            completed: progress.game1.completed,
            of: progress.game1.of,
            isDistributed: progress.game1.isDistributed,
            step: "questions"
          }
        });
      });
      return;
    }

    // countdown 2 (before the first game) was not passed
    if (!progress?.board1) {
      console.log("BOARD-1")
      getRaceById(Number(raceId), smartAccountAddress as `0x${string}`).then(data => {
        navigate(`/race/${raceId}/${data.questionsByGames.length}/${data.gamesCompletedPerUser.length}/questions`, {
          state: {
            questionsByGames: data.questionsByGames, 
            amountOfRegisteredUsers: data.registeredUsers.length, 
            progress,
            step: "board",
          }
        });
      });
      return;
    }

    // game 2 was not passed
    if (!progress?.game2?.isCompleted) {
      navigate(`/race/${raceId}/tunnel`, {
        state: {
          stage: progress.game2.stage,
          fuel: progress.game2.fuel
        }
      });
      return;
    }
      
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
          setAmountOfConnected(data.amount);
          console.log("CONNECTED:", data)
          // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
          if (data.amount === AMOUNT_OF_PLAYERS_PER_RACE) {
            setIsOpen(false);
            setModalType(undefined);
            // console.log("PPPPPPPPPPPPPPPPP-1", progress)
            handleNavigate(progress);
          }
        }
      });
      
      socket.on('joined', ({ raceId: raceIdSocket, userAddress }) => {
        console.log(raceIdSocket, raceId)
        if (raceIdSocket == raceId) {
          console.log("JOINED", raceIdSocket, userAddress);
          setAmountOfConnected(amountOfConnected + 1);
          if (amountOfConnected + 1 >= AMOUNT_OF_PLAYERS_PER_RACE) {
            setIsOpen(false);
            setModalType(undefined);
            // console.log("PPPPPPPPPPPPPPPPP-2", progress)
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

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
    // subtitle.style.color = "#f00";
  }

  function closeModal() {
    setIsOpen(false);
    setRaceId(null);
  }

  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom">
      <div className="mt-16 flex w-full justify-center">
        <RibbonLabel />
      </div>
      <div className="mx-8 my-4 flex h-3/5 flex-col gap-20 overflow-y-auto pt-4">
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

      { modalIsOpen && modalType === "waiting" && <WaitingForPlayersModal numberOfPlayers={amountOfConnected} numberOfPlayersRequired={AMOUNT_OF_PLAYERS_PER_RACE}/> }
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
