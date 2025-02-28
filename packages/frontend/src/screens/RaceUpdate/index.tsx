import { useEffect, useState } from "react";
import RaceBoard from "@/components/RaceBoard";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "@/utils/socketio";
import { useSmartAccount } from "@/hooks/smartAccountProvider";
import { httpGetRaceDataById } from "@/utils/http-requests";
import generateLink, { TFlowPhases } from "@/utils/linkGetter";
import TopPageTimer from "@/components/top-page-timer/TopPageTimer";
import { useGameContext } from "@/utils/game-context";
import { TRace, useRaceById } from "@/hooks/useRaceById";
import getScreenTime from "@/utils/getScreenTime";
import { useTimer } from "react-timer-hook";

const getPart = (board: string) => {
  let selectedPart = "";
  switch (board) {
    case "board1":
      selectedPart = "RACE_UPDATE_1"; break;
    case "board2":
      selectedPart = "RACE_UPDATE_2"; break;
    case "board3":
      selectedPart = "RACE_UPDATE_3"; break;
    case "board4":
      selectedPart = "RACE_UPDATE_4"; break;
    default:
      break;
  }

  return selectedPart;
}

type TProgress = { curr: number; delta: number; address: string };

function RaceUpdateScreen() {
  const {gameState, setGameStateObject} = useGameContext();
  const { smartAccountAddress } = useSmartAccount();
  const [seconds, setSeconds] = useState(10);
  const navigate = useNavigate();
  const {raceId, board} = useParams();
  const [progress, setProgress] = useState<TProgress[]>([]);
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const { race } = useRaceById(Number(raceId));

  const SCREEN_NAME = getPart(board as string);

  
  const handleExpire = async() => {
    console.log("UPDATE PRGOGRESS:", {
      raceId, 
      userAddress: smartAccountAddress,
      property: board,
      value: true,
    })

    // user have seen the raceboard progress, we must update update the state
    socket.emit('update-progress', {
      raceId, 
      userAddress: smartAccountAddress,
      property: board,
      value: true,
    });
    
    /*
    let redirectLink = '/';

    switch (board) {
      case "board1":
        redirectLink = generateLink("STORY_PART_1", Number(raceId)); break;
      case "board2":
        redirectLink = generateLink("STORY_PART_2", Number(raceId)); break;
      case "board3":
        redirectLink = generateLink("STORY_PART_3", Number(raceId)); break;
      case "board4":
        redirectLink = generateLink("STORY_PART_4", Number(raceId)); break;
      default:
        break;
    }
    */

    console.log("REDIRECT:", {progressData: await getNewProgress(race as TRace)});
    const currentScreenIndex = race?.screens.indexOf(SCREEN_NAME) as number;

    socket.emit('minimize-live-game', { part: SCREEN_NAME, raceId });
    gameState && setGameStateObject({ ...gameState, raceProgressVisual: await getNewProgress(race as TRace, true) });
    
    navigate(generateLink(race?.screens?.[currentScreenIndex + 1] as TFlowPhases, Number(raceId)));
  };

  const { totalSeconds, restart, pause } = useTimer({
      expiryTimestamp: new Date(),
      onExpire: handleExpire,
      autoStart: false
  });

  const getNewProgress = async(raceData: TRace, redirecting=false) => {
    let currentProgressVisual: TProgress[] = gameState?.raceProgressVisual || [];

    let newProgress: TProgress[] = raceData.progress.map((i: { user: string, progress: number }) => {
      const current = (() => {
        const playerPrevData = currentProgressVisual.find(j => j.address == i.user);
        return playerPrevData ? playerPrevData.curr : 0;
      })();
      const delta = Number(i.progress) - current;

      console.log({ 
        curr: redirecting ? delta : current,
        delta: redirecting ? current : delta, 
        address: i.user 
      });

      return { 
        curr: redirecting ? delta : current,
        delta: redirecting ? current : delta, 
        address: i.user 
      };
    });

    return newProgress;
  }

  useEffect(() => {
    if (String(raceId)?.length && smartAccountAddress && race) {
      console.log({ race })
      httpGetRaceDataById(`race-${raceId}`).then(async ({ data }) => {
        console.log({data});

        if (!race?.registeredUsers.includes(smartAccountAddress)) {
          // console.log("USER IS NOT LOGGED IN")
          navigate('/', { replace: true });
        }

        setProgress(await getNewProgress(race));

        setUsers(data?.race?.users || []);
      });
    }
  }, [raceId, smartAccountAddress, race]);

  useEffect(() => {
    if (race && SCREEN_NAME) {
      httpGetRaceDataById(`race-${race.id}`)
        .then(({ data }) => {
          const time = new Date();
          const expectedTime = getScreenTime(data, SCREEN_NAME);
          time.setSeconds(time.getSeconds() + expectedTime);

          setSeconds(expectedTime);
          restart(time);
        });
    }
  }, [race, SCREEN_NAME]);


  // handle socket events
  useEffect(() => {
    if (smartAccountAddress && race && board) {
      socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
        console.log({amount})
        if (raceId === raceIdSocket) {
          setAmountOfConnected(amount);
          // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
          if (amount === race.numOfPlayersRequired) {
            httpGetRaceDataById(`race-${race.id}`)
              .then(({ data }) => {
                const time = new Date();
                const expectedTime = getScreenTime(data, SCREEN_NAME);
                time.setSeconds(time.getSeconds() + expectedTime);

                setSeconds(expectedTime);
                restart(time);
              });
          }
        }
      });

      socket.on('joined', ({ raceId: raceIdSocket, userAddress, part: socketPart }) => {
        console.log("JOINED", raceIdSocket, raceId);

        if (raceId == raceIdSocket && socketPart == getPart(board)) {
          console.log("JOINED++")
          socket.emit("get-connected", { raceId });
        }
      });

      socket.on('leaved', ({ part, raceId: raceIdSocket, movedToNext, connectedCount }) => {
        if (part == getPart(board) && raceId == raceIdSocket && !movedToNext) {
          if (!movedToNext) {
            console.log("LEAVED")
            setAmountOfConnected(connectedCount);
          } else {
            handleExpire();
          }
          /*
          if (!modalIsOpen) {
            setModalIsOpen(true);
          }
          setModalType("waiting");
          */
        }
      });


      socket.on('race-progress', (progress) => {
        console.log("RACE PROGRESS PER USER:", progress);
      });
  
      return () => {
        socket.off('joined');
        socket.off('amount-of-connected');
        socket.off('leaved');
        socket.off('race-progress');
      }
    }
  }, [socket, raceId, smartAccountAddress, amountOfConnected, race, board]);

  useEffect(() => {
    if (smartAccountAddress && race) {
      socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
    }
  }, [socket, raceId, smartAccountAddress, race]);

  
  
  useEffect(() => {
    if (raceId && socket && race) {
      if (!socket.connected) {
        socket.connect();
      }
      
      socket.on('screen-changed', ({ screen }) => {
        if (race.screens.indexOf(screen) > race.screens.indexOf(SCREEN_NAME)) {
          socket.emit('update-progress', {
            raceId, 
            userAddress: smartAccountAddress,
            property: board,
            value: true,
          });
          navigate(generateLink(screen, Number(raceId)));
        }
      });
      
      socket.on('latest-screen', ({ screen }) => {
        if (race.screens.indexOf(screen) > race.screens.indexOf(SCREEN_NAME)) {
          socket.emit('update-progress', {
            raceId, 
            userAddress: smartAccountAddress,
            property: board,
            value: true,
          });
          navigate(generateLink(screen, Number(raceId)));
        }
      });
      
      return () => {
        socket.off('screen-changed');
        socket.off('latest-screen');
      }
    }
  }, [raceId, socket, race]);
  
  useEffect(() => {
    if(smartAccountAddress && String(raceId).length && board && race) {
        if (!socket.connected) {
          socket.connect();
        }
        socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: getPart(board) });
        // socket.emit("get-latest-screen", { raceId, part: getPart(board) });
    }
  }, [smartAccountAddress, socket, raceId, board, race]);

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


  return (
    <>
      <div className="mx-auto flex w-full flex-col bg-race_bg_track bg-cover bg-bottom" style={{ height: `${window.innerHeight}px` }}>
        <TopPageTimer duration={seconds * 1000} />
        <div className="absolute inset-0 bg-[rgb(153,161,149)]">
          { 
            <RaceBoard progress={progress} users={users}/>
          }
        </div>
      </div>
      {
        /*
        modalIsOpen && modalType === "waiting" && 
          <WaitingForPlayersModal 
            numberOfPlayers={amountOfConnected} 
            numberOfPlayersRequired={data?.numberOfPlayersRequired || 9}
          />
        */
      }
    </>
  );
}

export default RaceUpdateScreen;
