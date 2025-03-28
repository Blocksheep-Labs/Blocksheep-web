import { useEffect, useState } from "react";
import RaceBoard from "@/components/RaceBoard";
import { useNavigate, useParams } from "react-router-dom";
import { socket } from "@/utils/socketio";
import { useSmartAccount } from "@/hooks/smartAccountProvider";
import { httpGetRaceDataById } from "@/utils/http-requests";
import generateLink, { TFlowPhases } from "@/utils/linkGetter";
import Countdown321 from "@/components/3-2-1-go/3-2-1-go";
import { useGameContext } from "@/utils/game-context";
import { useRaceById } from "@/hooks/useRaceById";

const SCREEN_NAME = "RACE_START";

function CountDownScreen() {
  const { gameState, setGameStateObject } = useGameContext();
  const { smartAccountAddress } = useSmartAccount();
  const [seconds, setSeconds] = useState(7);
  const navigate = useNavigate();
  const {raceId} = useParams();
  const [progress, setProgress] = useState<{ curr: number; delta: number; address: string }[]>([]);
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const {race} = useRaceById(Number(raceId));
  const [raceUsersDataColors, setRaceUsersDataColors] = useState<Map<string, number>>(new Map());

  const handleClose = async() => {
    console.log("UPDATE PRGOGRESS:", {
      raceId, 
      userAddress: smartAccountAddress,
      property: "countdown",
      value: true,
    })
    // user have seen the raceboard progress, we must update update the state
    socket.emit('update-progress', {
      raceId, 
      userAddress: smartAccountAddress,
      property: "countdown",
      value: true,
    });

    const currentScreenIndex = race?.screens.indexOf(SCREEN_NAME) as number;

    socket.emit('minimize-live-game', { part: SCREEN_NAME, raceId });
    gameState && setGameStateObject({ ...gameState, raceProgressVisual: race?.progress.map((i: { user: string, progress: number }) => {
        return { 
          curr: 0, 
          delta: 0, 
          address: i.user 
        };
      })  
    } as any);

    navigate(generateLink(race?.screens?.[currentScreenIndex + 1] as TFlowPhases, Number(raceId)));
  };

  useEffect(() => {
    if (String(raceId).length && smartAccountAddress && race) {
      console.log({ race })
      httpGetRaceDataById(`race-${raceId}`).then(({ data }) => {
        console.log({data});

        setRaceUsersDataColors(new Map(Object.entries(data.race.usersSheeps)));

        if (!race?.registeredUsers.includes(smartAccountAddress)) {
          // console.log("USER IS NOT LOGGED IN")
          navigate('/', { replace: true });
        }

        let newProgress: { curr: number; delta: number; address: string }[] = race.progress.map(i => {
          return { 
            curr: -1, 
            delta: 1, 
            address: i.user 
          };
        });
        setProgress(newProgress);

        // SERVER DATA
        setUsers(data?.race?.users || []);
      });

    }
  }, [raceId, smartAccountAddress, race]);

  useEffect(() => {
    if (race) {
      const interval = setInterval(() => {
        setSeconds((old) => old - 1);
      }, 1000);

      return () => {
        setSeconds(7);
        clearInterval(interval);
      };
    }
  }, [race]);

  useEffect(() => {
    // eslint-disable-next-line no-undef
    if (seconds === -1 && race) {
      handleClose();
    }
  }, [seconds, race]);

  // handle socket events
  useEffect(() => {
    if (smartAccountAddress && gameState && race) {
      socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
        console.log({amount})
        if (raceId === raceIdSocket) {
          setAmountOfConnected(amount);
        }
      });

      socket.on('joined', ({ raceId: raceIdSocket, userAddress, part }) => {
          console.log("JOINED", raceIdSocket, raceId, part);
  
          if (raceId == raceIdSocket && part == SCREEN_NAME) {
            console.log("JOINED++")
            socket.emit("get-connected", { raceId });
          }
      });

      socket.on('leaved', ({ part, raceId: raceIdSocket, movedToNext, connectedCount }) => {
        if (part == SCREEN_NAME && raceIdSocket == raceId && !movedToNext && race) {
          
          if (!movedToNext) {
            console.log("LEAVED")
            setAmountOfConnected(connectedCount);
          } else {
            handleClose();
          }
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
  }, [socket, raceId, smartAccountAddress, amountOfConnected, gameState, race]);



  useEffect(() => {
    if(smartAccountAddress && String(raceId).length) {
        if (!socket.connected) {
          socket.connect();
        }
        socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: SCREEN_NAME });
        // socket.emit("get-latest-screen", { raceId, part: SCREEN_NAME });
    }
  }, [smartAccountAddress, socket, raceId]);

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
                property: "countdown",
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
                property: "countdown",
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
        <div className="absolute inset-0 bg-[rgb(153,161,149)]">
          <RaceBoard progress={progress} users={users} raceUsersDataColors={raceUsersDataColors}/>
          <div className="absolute left-0 top-0 flex size-full items-center justify-center">
            { seconds <= 5 && <Countdown321/> }
          </div>
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

export default CountDownScreen;
