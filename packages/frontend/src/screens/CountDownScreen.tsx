import React, { useEffect, useState } from "react";
import RaceBoard from "../components/RaceBoard";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { getRaceById } from "../utils/contract-functions";
import { usePrivy } from "@privy-io/react-auth";
import { socket } from "../utils/socketio";
import WaitingForPlayersModal from "../components/WaitingForPlayersModal";
import { useSmartAccount } from "../hooks/smartAccountProvider";


function CountDownScreen() {
  const location = useLocation();
  const { smartAccountAddress } = useSmartAccount();
  const [seconds, setSeconds] = useState(5);
  const navigate = useNavigate();
  const {raceId} = useParams();
  const [progress, setProgress] = useState<{ curr: number; delta: number; address: string }[]>([]);
  const [data, setData] = useState<any>(undefined);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [modalType, setModalType] = useState<"waiting" | "leaving" | undefined>(undefined);
  const [amountOfConnected, setAmountOfConnected] = useState(0);

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
    
    navigate(`/race/${raceId}/underdog/preview`, {
      state: location.state
    });
  };

  useEffect(() => {
    if (raceId?.length && smartAccountAddress) {
      getRaceById(Number(raceId), smartAccountAddress as `0x${string}`).then(data => {
        if (data) {
          console.log(data)
          // VALIDATE USER FOR BEING REGISTERED
          if (!data.registeredUsers.includes(smartAccountAddress)) {
            //console.log("USER IS NOT LOGGED IN !!!!!!!!!!!!!!", data.registeredUsers, smartAccountAddress)
            navigate('/');
          } 

          setData(data);

          let newProgress: { curr: number; delta: number; address: string }[] = data.progress.map(i => {
            return { curr: Number(i.progress), delta: 0, address: i.user };
          });
          setProgress(newProgress);
        }
      });
    }
  }, [raceId, smartAccountAddress]);

  useEffect(() => {
    if (data && amountOfConnected === data.numberOfPlayersRequired) {
      const interval = setInterval(() => {
        setSeconds((old) => (old > 0 ? old - 1 : 0));
      }, 1000);

      return () => {
        setSeconds(5);
        clearInterval(interval);
      };
    }
  }, [amountOfConnected, data]);

  useEffect(() => {
    // eslint-disable-next-line no-undef
    let timer: NodeJS.Timeout;
    if (seconds === 0 && data && amountOfConnected === data.numberOfPlayersRequired) {
      timer = setTimeout(handleClose, 1000);
      handleClose();
    }
    return () => {
      clearTimeout(timer);
    };
  }, [seconds, amountOfConnected, data]);

  // handle socket events
  useEffect(() => {
    if (smartAccountAddress && data) {
      socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
        console.log({amount})
        if (raceId === raceIdSocket) {
          setAmountOfConnected(amount);
          // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
          if (amount === data.numberOfPlayersRequired) {
            setModalIsOpen(false);
            setModalType(undefined);
          }
        }
      });

      socket.on('joined', ({ raceId: raceIdSocket, userAddress }) => {
        console.log("JOINED", raceIdSocket, raceId);

        if (raceId == raceIdSocket) {
          console.log("JOINED++")
          setAmountOfConnected(amountOfConnected + 1);
          if (amountOfConnected + 1 >= data.numberOfPlayersRequired) {
            setModalIsOpen(false);
            setModalType(undefined);
          }
        }
      });

      socket.on('leaved', () => {
        console.log("LEAVED")
        setAmountOfConnected(amountOfConnected - 1);
        if (!modalIsOpen) {
          setModalIsOpen(true);
        }
        setModalType("waiting");
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
  }, [socket, raceId, smartAccountAddress, amountOfConnected, data]);

  useEffect(() => {
    setModalIsOpen(true);
    setModalType("waiting");
    if (smartAccountAddress && data) {
      socket.emit("get-connected", { raceId });
      socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
    }
  }, [socket, raceId, smartAccountAddress, data]);


  return (
    <>
      <div className="mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom">
        <div className="absolute inset-0 bg-[rgb(153,161,149)]">
          <RaceBoard progress={progress} />
          <div className="absolute left-0 top-0 flex size-full items-center justify-center">
            <div className="flex size-36 items-center justify-center rounded-3xl bg-yellow-500">
              <p className="font-[Berlin] text-[70px]">{seconds === 0 ? "GO" : seconds}</p>
            </div>
          </div>
        </div>
      </div>
      {
        modalIsOpen && modalType === "waiting" && 
          <WaitingForPlayersModal 
            numberOfPlayers={amountOfConnected} 
            numberOfPlayersRequired={data?.numberOfPlayersRequired || 9}
          />
      }
    </>
  );
}

export default CountDownScreen;
