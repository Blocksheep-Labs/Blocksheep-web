import { useEffect, useState } from "react";
import RaceBoard from "../../components/RaceBoard";
import { useNavigate, useParams } from "react-router-dom";
import { getRaceById } from "../../utils/contract-functions";
import { socket } from "../../utils/socketio";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import { httpGetRaceDataById } from "../../utils/http-requests";
import generateLink from "../../utils/linkGetter";
import TopPageTimer from "../../components/top-page-timer/TopPageTimer";
import { useGameContext } from "../../utils/game-context";

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
  const [data, setData] = useState<any>(undefined);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalType, setModalType] = useState<"waiting" | "leaving" | undefined>(undefined);
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [secondsVisual, setSecondsVisual] = useState(1000);
  
  const handleClose = async() => {
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

    console.log("REDIRECT:", {progressData: await getNewProgress()})
    socket.emit('minimize-live-game', { part: getPart(board as string), raceId });
    gameState && setGameStateObject({ ...gameState, raceProgressVisual: await getNewProgress(true) })
    navigate(redirectLink);
  };

  const getNewProgress = async(redirecting=false) => {
    let usedValueForData = undefined;
    if (!data) {
      usedValueForData = await getRaceById(Number(raceId), smartAccountAddress as `0x${string}`);
    } else {
      usedValueForData = data;
    }

    let currentProgressVisual: TProgress[] = gameState?.raceProgressVisual || [];
          
    let newProgress: TProgress[] = usedValueForData.progress.map((i: { user: string, progress: number }) => {
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
    if (raceId?.length && smartAccountAddress) {
      Promise.all([
        getRaceById(Number(raceId), smartAccountAddress as `0x${string}`),
        httpGetRaceDataById(`race-${raceId}`)
      ]).then(data => {
        return {
          contractData: data[0],
          serverData: data[1].data,
        }
      }).then(async data => {
        if (data.contractData && data.serverData) {
          // CONTRACT DATA
          console.log({data});
          // validate user for being registered
          if (!data.contractData.registeredUsers.includes(smartAccountAddress)) {
            // console.log("USER IS NOT LOGGED IN")
            navigate('/', {  });
          } 

          setData(data.contractData);
          
          setProgress(await getNewProgress());

          // SERVER DATA
          setUsers(data?.serverData?.race?.users || []);
        }
      });

    }
  }, [raceId, smartAccountAddress]);

  useEffect(() => {
    if (data) {
      setSecondsVisual(10);
      const interval = setInterval(() => {
        setSeconds((old) => (old > 0 ? old - 1 : 0));
      }, 1000);

      return () => {
        setSeconds(10);
        clearInterval(interval);
      };
    }
  }, [data]);

  useEffect(() => {
    // eslint-disable-next-line no-undef
    let timer: NodeJS.Timeout;
    if (seconds === 0 && data) {
      timer = setTimeout(handleClose, 1000);
      handleClose();
    }
    return () => {
      clearTimeout(timer);
    };
  }, [seconds, data]);

  // handle socket events
  useEffect(() => {
    if (smartAccountAddress && data && board) {
      socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
        console.log({amount})
        if (raceId === raceIdSocket) {
          setAmountOfConnected(amount);
          // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
          if (amount === data.numberOfPlayersRequired) {
            setModalIsOpen(false);
            setModalType(undefined);
            setSecondsVisual(10);
          }
        }
      });

      socket.on('joined', ({ raceId: raceIdSocket, userAddress, part: socketPart }) => {
        console.log("JOINED", raceIdSocket, raceId);

        if (raceId == raceIdSocket && socketPart == getPart(board)) {
          console.log("JOINED++")
          /*
          setAmountOfConnected(amountOfConnected + 1);
          if (amountOfConnected + 1 >= data.numberOfPlayersRequired) {
            setModalIsOpen(false);
            setModalType(undefined);
            setSecondsVisual(10);
          }
          */

          socket.emit("get-connected", { raceId });
        }
      });

      socket.on('leaved', ({ part, raceId: raceIdSocket, movedToNext }) => {
        if (part == getPart(board) && raceId == raceIdSocket && !movedToNext) {
          if (!movedToNext) {
            console.log("LEAVED")
            setAmountOfConnected(amountOfConnected - 1);
          } else {
            handleClose();
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
  }, [socket, raceId, smartAccountAddress, amountOfConnected, data, board]);

  useEffect(() => {
    setModalIsOpen(true);
    setModalType("waiting");
    if (smartAccountAddress && data) {
      socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
    }
  }, [socket, raceId, smartAccountAddress, data]);

  useEffect(() => {
    if(smartAccountAddress && String(raceId).length && board && data) {
        if (!socket.connected) {
          socket.connect();
        }
        socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: getPart(board) });
        socket.emit("get-latest-screen", { raceId, part: getPart(board) });
    }
  }, [smartAccountAddress, socket, raceId, board, data]);


  useEffect(() => {
      if (raceId && socket) {
          if (!socket.connected) {
              socket.connect();
          }
          
          socket.on('screen-changed', ({ screen }) => {
              socket.emit('update-progress', {
                raceId, 
                userAddress: smartAccountAddress,
                property: board,
                value: true,
              });
              navigate(generateLink(screen, Number(raceId)));
          });
  
          return () => {
              socket.off('screen-changed');
          }
      }
  }, [raceId, socket]);


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
        <TopPageTimer duration={secondsVisual * 1000} />
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
