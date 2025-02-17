import React, { useEffect, useState } from "react";
import RaceBoard from "../../components/RaceBoard";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getRaceById } from "../../utils/contract-functions";
import { usePrivy } from "@privy-io/react-auth";
import { socket } from "../../utils/socketio";
import WaitingForPlayersModal from "../../components/modals/WaitingForPlayersModal";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import { httpGetRaceDataById } from "../../utils/http-requests";
import generateLink from "../../utils/linkGetter";
import Countdown321 from "../../components/3-2-1-go/3-2-1-go";
import { useGameContext } from "../../utils/game-context";


function CountDownScreen() {
  const { gameState, setGameStateObject } = useGameContext();
  const { smartAccountAddress } = useSmartAccount();
  const [seconds, setSeconds] = useState(7);
  const navigate = useNavigate();
  const {raceId} = useParams();
  const [progress, setProgress] = useState<{ curr: number; delta: number; address: string }[]>([]);
  const [data, setData] = useState<any>(undefined);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalType, setModalType] = useState<"waiting" | "leaving" | undefined>(undefined);
  const [amountOfConnected, setAmountOfConnected] = useState(0);
  const [users, setUsers] = useState<any[]>([]);


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

    //console.log("BEFORE NAVIGATE", data);
    //console.log(`/race/${raceId}/${data.questionsByGames.length}/${data.gamesCompletedPerUser.length}/questions`)
    //return;

    socket.emit('minimize-live-game', { part: 'RACE_START', raceId });
    gameState && setGameStateObject({ ...gameState, raceProgressVisual: data.progress.map((i: { user: string, progress: number }) => {
        return { 
          curr: 0, 
          delta: 0, 
          address: i.user 
        };
      })  
    })
    navigate(generateLink("RABBIT_HOLE_PREVIEW", Number(raceId)));
  };

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
      }).then(data => {
        if (data.contractData && data.serverData) {
          // CONTRACT DATA
          console.log({data});
          // validate user for being registered
          if (!data.contractData.registeredUsers.includes(smartAccountAddress)) {
            // console.log("USER IS NOT LOGGED IN")
            navigate('/', { replace: true });
          } 

          setData(data.contractData);

          let newProgress: { curr: number; delta: number; address: string }[] = data.contractData.progress.map(i => {
            return { 
              curr: -1, 
              delta: 1, 
              address: i.user 
            };
          });
          setProgress(newProgress);

          // SERVER DATA
          setUsers(data?.serverData?.race?.users || []);
        }
      });

    }
  }, [raceId, smartAccountAddress]);

  useEffect(() => {
    if (data) {
      const interval = setInterval(() => {
        setSeconds((old) => old - 1);
      }, 1000);

      return () => {
        setSeconds(7);
        clearInterval(interval);
      };
    }
  }, [data]);

  useEffect(() => {
    // eslint-disable-next-line no-undef
    if (seconds === -1 && data) {
      handleClose();
    }
  }, [seconds, data]);

  // handle socket events
  useEffect(() => {
    if (smartAccountAddress && gameState) {
      socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
        console.log({amount})
        if (raceId === raceIdSocket) {
          setAmountOfConnected(amount);
          // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
          if (amount === gameState.amountOfRegisteredUsers) {
            setModalIsOpen(false);
            setModalType(undefined);
          }
        }
      });

      socket.on('joined', ({ raceId: raceIdSocket, userAddress, part }) => {
          console.log("JOINED", raceIdSocket, raceId, part);
  
          if (raceId == raceIdSocket && part == "RACE_START") {
            console.log("JOINED++")
            socket.emit("get-connected", { raceId });
          }
      });

      socket.on('leaved', ({ part, raceId: raceIdSocket, movedToNext }) => {
        if (part == "RACE_START" && raceIdSocket == raceId && !movedToNext) {
          
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
  }, [socket, raceId, smartAccountAddress, amountOfConnected, gameState]);



  useEffect(() => {
    if(smartAccountAddress && String(raceId).length) {
        setModalIsOpen(true);
        setModalType("waiting");
        if (!socket.connected) {
          socket.connect();
        }
        socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: "RACE_START" });
        socket.emit("get-latest-screen", { raceId, part: "RACE_START" });
    }
  }, [smartAccountAddress, socket, raceId]);

  useEffect(() => {
      if (raceId && socket) {
          if (!socket.connected) {
              socket.connect();
          }
          
          socket.on('screen-changed', ({ screen }) => {
              socket.emit('update-progress', {
                raceId, 
                userAddress: smartAccountAddress,
                property: "countdown",
                value: true,
              });
              navigate(generateLink(screen, Number(raceId)));
          });

          socket.on('latest-screen', ({ screen }) => {
            if (screen !== "RACE_START") {
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
        <div className="absolute inset-0 bg-[rgb(153,161,149)]">
          <RaceBoard progress={progress} users={users}/>
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
