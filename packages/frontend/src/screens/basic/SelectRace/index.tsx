import { useCallback, useEffect, useMemo, useState } from "react";
import RibbonLabel from "../../../components/RibbonLabel";
import RaceItem from "../../../components/race-item/RaceItem";
import { useNavigate } from "react-router-dom";
import { buyTokens, getRaceById, getRacesWithPagination, getTestETH, registerOnTheRace, retreiveCOST } from "../../../utils/contract-functions";
import RegisteringModal from "../../../components/modals/RegisteringModal";
import RegisteredModal from "../../../components/modals/RegisteredModal";
import { socket } from "../../../utils/socketio";
import WaitingForPlayersModal from "../../../components/modals/WaitingForPlayersModal";
import { useSmartAccount } from "../../../hooks/smartAccountProvider";
import generateLink, { TFlowPhases } from "../../../utils/linkGetter";
import { useGameContext } from "../../../utils/game-context";
import { httpGetRacesUserParticipatesIn, httpGetUserDataByAddress, httpRaceInsertUser } from "../../../utils/http-requests";
import { useBalance } from "wagmi";
import SynchronizingModal from "../../../components/modals/SynchronizingModal";


function SelectRaceScreen() {
  const { smartAccountClient, smartAccountAddress } = useSmartAccount();
  const navigate = useNavigate();
  const { updateGameState, gameState } = useGameContext();
  const [races, setRaces] = useState<any[]>([]);
  const [racesUserParticipatesIn, setRacesUserParticipatesIn] = useState<any[]>([]);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [raceId, setRaceId] = useState<number | null>(null);
  const [cost, setCost] = useState(0);
  const [modalType, setModalType] = useState<"registering" | "registered" | "waiting" | "synchronizing" | undefined>(undefined);
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [progress, setProgress] = useState<any>(null);

  const { data: ETHBalance } = useBalance({
    address: smartAccountAddress
  });

  const handleNavigate = useCallback((progress: any, screen: TFlowPhases) => {
    console.log("NAVIGATE", amountOfConnected);
    console.log("PROGRESS-----------", progress);
    socket.emit('minimize-live-game', { part: 'RACE_SELECTION', raceId });
    
    const rIdNumber = Number(raceId);

    // SAVE USER RACE AFTER JOIN
    const currentUserActiveGames = JSON.parse(localStorage.getItem("races") as string) || [];
    localStorage.setItem("races", JSON.stringify(Array.from(new Set([...currentUserActiveGames, raceId]))));

    /*
    if (screen !== "BULL_RUN") {
      getRaceById(rIdNumber, smartAccountAddress as `0x${string}`).then(data => {
        updateGameState(data, progress, undefined);
        navigate(`/race/${raceId}/bullrun/rules`);
      });
      return;
    }
    */
    
    
    getRaceById(rIdNumber, smartAccountAddress as `0x${string}`).then(data => {
      updateGameState(data, progress, undefined);
      navigate(generateLink(screen, rIdNumber));
    });
  }, [raceId]);

  const fetchAndSetRaces = useCallback(async() => {
    if (smartAccountAddress) {
      getRacesWithPagination(smartAccountAddress as `0x${string}`, 0).then(data => {
        setRaces(data as any[]);
      });

      httpGetRacesUserParticipatesIn(smartAccountAddress as `0x${string}`).then(({data}) => {
        // console.log(data.races)
        setRacesUserParticipatesIn(data.races);
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

  console.log(modalType)

  useEffect(() => {
    if (smartAccountAddress) {
      socket.on('race-progress', ({progress, latestScreen}) => {
        //alert(latestScreen)
        console.log("PROGRESS SET", progress)
        
        console.log(latestScreen)
        if (progress?.progress) {
          setProgress(progress.progress);
          // if teh user left on not-playable screen, we have to navigate him to the actual screen
          if (!["UNDERDOG", "RABBIT_HOLE", "BULL_RUN"].includes(latestScreen)) {
            handleNavigate(progress.progress, latestScreen);
          } else {
            //if (!modalIsOpen) {
              setIsOpen(true);
              setModalType("synchronizing");
            //} 
            setTimeout(() => {
              socket.emit("get-latest-screen", { raceId, userAddress: smartAccountAddress });
            }, 1200);
          }
        }
      });


      socket.on('amount-of-connected', (data) => {
        // prevent amount of players tracking if we are waiting to synchronize with the game
        if (modalType == "synchronizing" && modalIsOpen) {
          console.log(modalType, modalIsOpen)
          return;
        }

        if (data.raceId == raceId) {
          if (racesUserParticipatesIn.includes(smartAccountAddress) && modalType !== "synchronizing") {
            console.log("Ready to navigate!");
            socket.emit('get-latest-screen', { raceId });
            return;
          }
          const race = races.find((r: any) => r.id === raceId);
          setAmountOfConnected(data.amount);
          console.log("Got amount of connected:", data);
          if (modalType !== "synchronizing") {
            setIsOpen(true);
            setModalType("waiting");

            // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
            console.log(data.amount === race.numOfPlayersRequired, race.numOfPlayersRequired)
  
            if (data.amount === race.numOfPlayersRequired) {
              console.log("Ready to navigate!");
              socket.emit('get-latest-screen', { raceId });
            }
          }
        }
      });

      socket.on('latest-screen', ({raceId: raceIdSocket, screen}) => {
        // prevent amount of players tracking if we are waiting to synchronize with the game
        //if (modalType == "synchronizing" && modalIsOpen) {
        //  console.log(modalType, modalIsOpen)
        //  return;
        //}

        console.log({screen});
        if (raceIdSocket == raceId) {
          setIsOpen(false);
          setModalType(undefined);
          // alert("naviagte because of latest screen")
          if (!["UNDERDOG", "RABBIT_HOLE", "BULL_RUN"].includes(screen)) {
            handleNavigate(progress, screen);
          } else {
            //if (!modalIsOpen) {
              setIsOpen(true);
              setModalType("synchronizing");
            //} 
            setTimeout(() => {
              socket.emit("get-latest-screen", { raceId, userAddress: smartAccountAddress });
            }, 1200);
          }
        }
      });
      
      socket.on('joined', ({ raceId: raceIdSocket, userAddress }) => {
        // prevent amount of players tracking if we are waiting to synchronize with the game
        if (modalType == "synchronizing" && modalIsOpen) {
          console.log(modalType, modalIsOpen)
          return;
        }

        const race = races.find((r: any) => r.id === raceId);
        console.log("Player joined:", {raceIdSocket, raceId, race})

        if (raceIdSocket == raceId) {
          console.log("JOINED++", raceIdSocket, userAddress);
          socket.emit("get-connected", { raceId });
        }
      });

      socket.on('leaved', ({ raceId: raceIdSocket, part, movedToNext }) => {
        // prevent amount of players tracking if we are waiting to synchronize with the game
        if (modalType == "synchronizing" && modalIsOpen) {
          console.log(modalType, modalIsOpen)
          return;
        }

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
        socket.off('latest-screen');
      }
    }
  }, [
    socket, 
    raceId, 
    smartAccountAddress, 
    amountOfConnected, 
    progress, 
    racesUserParticipatesIn, 
    modalType, 
    modalIsOpen
  ]);


  const onClickJoin = useCallback((id: number) => {
    console.log("Joining...", id);
    socket.connect();
    
    if (smartAccountAddress) {
      console.log("Smart account is connected, requesting progress", {raceId: id, userAddress: smartAccountAddress});
      // get user by wallet address
      httpGetUserDataByAddress(smartAccountAddress).then(({ data }) => {
        // update race by inserting a user into race
        httpRaceInsertUser(`race-${id}`, data.user._id).then(() => {
          socket.emit("get-progress", { raceId: id, userAddress: smartAccountAddress });
          setTimeout(() => {
            console.log("Connecting into the game", {raceId: id, userAddress: smartAccountAddress});
            socket.emit("connect-live-game", { raceId: id, userAddress: smartAccountAddress });
          }, 500);
          setRaceId(id);

          setIsOpen(true);
          setModalType("waiting");
        });
      });
    } 
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
    await getTestETH(30, smartAccountClient, smartAccountAddress, Number(ETHBalance?.formatted))
        .then(() => {
          console.log('Got test ETH!')
        })
        .catch(console.error);

    await registerOnTheRace(id, questionsCount, smartAccountClient, smartAccountAddress).then(async _ => {
      console.log("REGISTERED, fetching list of races...");
      
      try {
        const raceData = await getRaceById(Number(raceId), smartAccountAddress as `0x${string}`);
        
        fetchAndSetRaces();
  
        if (!raceData.registeredUsers.map((i: string) => i.toLowerCase()).includes(smartAccountAddress?.toLowerCase())) {
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
    <div className={`mx-auto flex w-full flex-col bg-race_bg bg-cover bg-bottom`} style={{ height: `${window.innerHeight}px` }}>
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
              participatesIn={racesUserParticipatesIn}
            />
          ))}
      </div>
      { modalIsOpen && modalType === "synchronizing" &&  <SynchronizingModal/> }
      { 
        modalIsOpen && modalType === "waiting" && <WaitingForPlayersModal numberOfPlayers={amountOfConnected} numberOfPlayersRequired={races.find((r: any) => r.id === raceId)?.numOfPlayersRequired || 9}/> 
      }
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
