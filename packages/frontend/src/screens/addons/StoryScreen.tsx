import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../../utils/socketio";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import { useTimer } from "react-timer-hook";
import WaitingForPlayersModal from "../../components/modals/WaitingForPlayersModal";

export default function StoryScreen() {
    const navigate = useNavigate();
    const {raceId, part} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const location = useLocation();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalType, setModalType] = useState<"waiting" | "leaving" | undefined>(undefined);

    const time = new Date();
    time.setSeconds(time.getSeconds() + 10);

    const { totalSeconds, restart, pause } = useTimer({
        expiryTimestamp: time,
        onExpire: () => {
            console.log("UPDATE PROGRESS", {
                raceId,
                userAddress: smartAccountAddress,
                property: `story-${part}`,
            });
            socket.emit('update-progress', {
                raceId,
                userAddress: smartAccountAddress,
                property: `story-${part}`,
            });
            
            navigate(`/race/${raceId}/countdown`, {
                state: location.state
            });
        },
        autoStart: true
    });

    useEffect(() => {
        if (location.state && amountOfConnected === location.state.amountOfRegisteredUsers) {    
            const time = new Date();
            time.setSeconds(time.getSeconds() + 10);
            restart(time);
        } else {
            pause();
        }
    }, [amountOfConnected, location.state]);

    // handle socket events
    useEffect(() => {
        if (smartAccountAddress && location.state) {
            socket.on('amount-of-connected', ({amount, raceId: raceIdSocket}) => {
                console.log({amount})
                if (raceId === raceIdSocket) {
                    setAmountOfConnected(amount);
                    // handle amount of connected === AMOUNT_OF_PLAYERS_PER_RACE
                    if (amount === location.state.amountOfRegisteredUsers) {
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
                    if (amountOfConnected + 1 >= location.state.amountOfRegisteredUsers) {
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
        
            return () => {
                socket.off('joined');
                socket.off('amount-of-connected');
                socket.off('leaved');
            }
        }
    }, [socket, raceId, smartAccountAddress, amountOfConnected, location.state]);

    useEffect(() => {
        setModalIsOpen(true);
        setModalType("waiting");
        if (smartAccountAddress && location.state) {
        socket.emit("get-connected", { raceId });
        socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
        }
    }, [socket, raceId, smartAccountAddress, location.state]);

    return (
        <div className="bg-white h-full relative">
            <div className="w-full bg-gray-200 h-2.5 dark:bg-gray-700">
                <div className="bg-yellow-500 h-2.5 transition-all duration-300" style={{width: `${totalSeconds * 10}%`}}></div>
            </div>
            <video autoPlay muted className="asbolute w-full h-full object-cover">
                <source src="https://dhozvkf4o988s.cloudfront.net/u6xcem%2Ffile%2F9d0985772eb3af5cd98e28022de6e4ff_a0d560eb84c307cefd2cf4303467a2b0.mp4?response-content-disposition=inline%3Bfilename%3D%229d0985772eb3af5cd98e28022de6e4ff_a0d560eb84c307cefd2cf4303467a2b0.mp4%22%3B&response-content-type=video%2Fmp4&Expires=1727712074&Signature=YZBCe13MGQ97jRiRq3-lJOBfrAubyyL7mQdVuiWXEHZBDq1AIPe9mmPxBhaKkjT~r4W3VSEDRB0mcq886X63aOwURr9NSkCVCrvcOBLXTITQkLNEcjlz8Y3BjCVyFsCAfJ1PEJpsvLLa8H2yyNkhVlE8qOUa43LvnWjWARKFsphUAuZLCZSGByRVFln56y4fdiItrQ6xuCyP5qrcNtV1ONXXsS8ocpU-nYWEMZuu4X4Lbq0YnFSY4iEkklmWGKxohAtKOuYqc9Jg3d73CZMD3957ubsFNt4ICntN2Uxph6d7nzAHY2vlQc2FpJYZ~o5OIw9wi01PADIR1NngK4Zp0g__&Key-Pair-Id=APKAJT5WQLLEOADKLHBQ" type="video/mp4" />
                Your browser does not support the video tag.
            </video>

            <div className="absolute bottom-5 bg-black bg-opacity-50 p-5">
                <p className="text-3xl text-center text-white">
                    In the silence between breaths, a signal ignites;
                    the world awakens to the hum of possibility.
                </p>
            </div>

            {
                modalIsOpen && modalType === "waiting" && 
                <WaitingForPlayersModal 
                    numberOfPlayers={amountOfConnected} 
                    numberOfPlayersRequired={location?.state?.amountOfRegisteredUsers || 9}
                />
            }
        </div>
    );
}