import { useCallback, useEffect, useMemo, useState } from "react";
import RibbonLabel from "../../components/RibbonLabel";
import RaceItem from "@/components/race-item/RaceItem";
import { useNavigate } from "react-router-dom";
import { getRaceById, getTestETH } from "../../utils/contract-functions";
import RegisteringModal from "../../components/modals/RegisteringModal";
import RegisteredModal from "../../components/modals/RegisteredModal";
import { socket } from "../../utils/socketio";
import WaitingForPlayersModal from "../../components/modals/WaitingForPlayersModal";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import generateLink, { TFlowPhases } from "../../utils/linkGetter";
import { useGameContext } from "../../utils/game-context";
import { httpGetUserDataByAddress, httpRaceInsertUser } from "../../utils/http-requests";
import { useBalance } from "wagmi";
import SynchronizingModal from "@/components/modals/SynchronizingModal";
import { useRegisterOnTheRace } from "../../hooks/useRegisterOnTheRace";
import { useRaceById } from "../../hooks/useRaceById";
import { useRacesWithPagination } from "../../hooks/useRacesWithPagination";


function SelectRaceScreen() {
  const { smartAccountClient, smartAccountAddress } = useSmartAccount();

  const { processTransaction } = useRegisterOnTheRace();
  const navigate = useNavigate();
  const { updateGameState } = useGameContext();

  const [racesUserParticipatesIn, setRacesUserParticipatesIn] = useState<any[]>([]);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [raceId, setRaceId] = useState<number | null>(null);
  const [modalType, setModalType] = useState<"registering" | "registered" | "waiting" | "synchronizing" | undefined>(undefined);
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [progress, setProgress] = useState<any>(null);
  const [isJoining, setIsJoining] = useState(false);

  const { race } = useRaceById(raceId);
  const { races } = useRacesWithPagination(0); 

  const { data: ETHBalance } = useBalance({
    address: smartAccountAddress
  });

  //console.log({ETHBalance: ETHBalance?.formatted})

  const handleNavigate = useCallback((progress: any, screen: TFlowPhases) => {
    console.log("NAVIGATE", amountOfConnected);
    console.log("PROGRESS-----------", progress);
    socket.emit('minimize-live-game', { part: 'RACE_SELECTION', raceId });
    
    const rIdNumber = Number(raceId);

    // SAVE USER RACE AFTER JOIN
    const currentUserActiveGames = JSON.parse(localStorage.getItem("races") as string) || [];
    localStorage.setItem("races", JSON.stringify(Array.from(new Set([...currentUserActiveGames, raceId]))));

    
    
    /*
      updateGameState(race, progress, undefined);
      navigate(`/race/${raceId}/underdog/rules`);
      return;
    */

    //getRaceById(rIdNumber, smartAccountAddress as `0x${string}`).then(data => {
      updateGameState(race, progress, undefined);
      navigate(generateLink("RACE_START", rIdNumber));
    //});
  }, [raceId, race]);


  const selectedRace = useMemo(() => {
    if (!races) {
      return undefined;
    }
    return races.find(({ id }) => id === raceId);
  }, [races, raceId]);


  useEffect(() => {
    if (smartAccountAddress) {
      socket.on('race-progress', ({progress, latestScreen}) => {
        //alert(latestScreen)
        console.log("PROGRESS SET", progress)
        
        console.log(latestScreen)
        if (progress?.progress) {
          setProgress(progress.progress);
          // if teh user left on not-playable screen, we have to navigate him to the actual screen
          if (!["UNDERDOG", "RABBIT_HOLE", "BULLRUN"].includes(latestScreen)) {
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
          const race = races?.find((r: any) => r.id === raceId);
          setAmountOfConnected(data.amount);
          console.log("Got amount of connected:", data);
          if (modalType !== "synchronizing") {
            setIsOpen(true);
            setModalType("waiting");

            // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
            console.log(data.amount === race?.numOfPlayersRequired, race?.numOfPlayersRequired)
  
            if (data.amount === race?.numOfPlayersRequired) {
              console.log("Ready to navigate!");
              socket.emit('get-latest-screen', { raceId });
            }
          }
        }
      });

      socket.on('latest-screen', ({raceId: raceIdSocket, screen}) => {
        console.log({screen});
        if (raceIdSocket == raceId) {
          setIsOpen(false);
          setModalType(undefined);
          
          if (!["UNDERDOG", "RABBIT_HOLE", "BULLRUN"].includes(screen)) {
            handleNavigate(progress, screen);
          } else {
            setIsOpen(true);
            setModalType("synchronizing");
            
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

        const race = races?.find((r: any) => r.id === raceId);
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


  useEffect(() => {
    if (smartAccountAddress && race && isJoining && socket) {
      console.log("Joining...");
      socket.connect();

      console.log("Smart account is connected, requesting progress", {raceId: race.id, userAddress: smartAccountAddress});
      console.log({ race });
      const convertedRaceId = Number(race.id);

      // get user by wallet address
      httpGetUserDataByAddress(smartAccountAddress).then(({ data }) => {
        // update race by inserting a user into race
        httpRaceInsertUser(`race-${convertedRaceId}`, data.user._id).then(() => {
          socket.emit("get-progress", { raceId: convertedRaceId, userAddress: smartAccountAddress });

          setTimeout(() => {
            console.log("Connecting into the game", {
              raceId: convertedRaceId, 
              userAddress: smartAccountAddress
            });

            socket.emit("connect-live-game", { 
              raceId: convertedRaceId, 
              userAddress: smartAccountAddress, 
              screensOrder: race.screens 
            });
          }, 500);
          
          setIsOpen(true);
          setModalType("waiting");
        });
      });
    } 
  }, [isJoining, smartAccountAddress, socket, race])

  useEffect(() => {
    if (socket && raceId !== null && smartAccountAddress && race) {
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
              socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, screensOrder: race.screens });
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
  }, [raceId, socket, smartAccountAddress, race]);

  const onClickRegister = useCallback(async(id: number) => {
    setIsOpen(true);
    setModalType("registering");
    console.log('Requesting test ETH if needed.');
    await getTestETH(30, smartAccountClient, smartAccountAddress, Number(ETHBalance?.formatted))
        .then(() => {
          console.log('Got test ETH!')
        })
        .catch(console.error);
    
    processTransaction(id).then(async _ => {
      console.log("REGISTERED, fetching list of races...");
      
      try {
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
  }, [smartAccountAddress, ETHBalance]);

  function closeModalAndJoin() {
    setIsJoining(true);
  }


  return (
    <div className={`mx-auto flex w-full flex-col bg-race_bg bg-cover bg-bottom`} style={{ height: `${window.innerHeight}px` }}>
      {
        // <TopScreenMessage/>
      }
      <div className="mt-16 flex w-full justify-center">
        <RibbonLabel text="Races"/>
      </div>
      <div className="mt-2 pb-20 flex h-full flex-col gap-28 overflow-y-auto pt-28 items-center">
        {races &&
          races.map((r, i) => (
            <RaceItem
              key={i.toString()}
              cost={30}
              race={r as any}
              onClickJoin={() => {
                setRaceId(r.id);
                setIsJoining(true);
              }}
              onClickRegister={onClickRegister}
              participatesIn={racesUserParticipatesIn}
            />
          ))
        }
      </div>
      { modalIsOpen && modalType === "synchronizing" &&  <SynchronizingModal/> }
      { 
        modalIsOpen && modalType === "waiting" && <WaitingForPlayersModal numberOfPlayers={amountOfConnected} numberOfPlayersRequired={races?.find((r: any) => r.id === raceId)?.numOfPlayersRequired || 9}/> 
      }
      { modalIsOpen && modalType === "registering" && <RegisteringModal/> }
      { modalIsOpen && modalType === "registered"  && <RegisteredModal handleClose={closeModalAndJoin} timeToStart={(() => {
          // @ts-ignore
          const dt = new Date(Number(selectedRace?.endAt) * 1000);
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
