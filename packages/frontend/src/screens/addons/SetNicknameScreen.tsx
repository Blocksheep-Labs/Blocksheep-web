import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";
import { socket } from "../../utils/socketio";
import RibbonLabel from "../../components/RibbonLabel";
import WaitingForPlayersModal from "../../components/modals/WaitingForPlayersModal";
import { useEffect, useRef, useState } from "react";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import NextFlag from "../../assets/common/flag.png";
import ChooseNameSheep from "../../assets/common/choosename.png";
import { httpGetUserDataByAddress, httpRaceInsertUser, httpSetNameByAddress } from "../../utils/http-requests";
import Rule from "../../components/Rule";
import generateLink from "../../utils/linkGetter";


export default function SetNicknameScreen() {
    const navigate = useNavigate();
    const {raceId} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const location = useLocation();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [amountOfNextClicked, setAmountOfNextClicked] = useState(0);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalType, setModalType] = useState<"waiting" | "leaving" | "nickname-set" | undefined>(undefined);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const time = new Date();
    time.setSeconds(time.getSeconds() + 15);

    const { totalSeconds, restart, pause } = useTimer({
        expiryTimestamp: time,
        onExpire: () => {
            handleSubmitNickname();
        },
        autoStart: true
    });

    const handleSubmitNickname = () => {
        if (inputRef.current) {
            let nickname = inputRef.current.value;

            if (!nickname.length || nickname.length > 10) {
                nickname = Date.now().toString().slice(0, 5);
            }

            if (nickname.length > 0 && nickname.length < 10 && smartAccountAddress) {
                httpSetNameByAddress(nickname, smartAccountAddress).then(({data}) => {
                    httpRaceInsertUser(`race-${raceId}`, data.user._id).then(({data}) => {
                        console.log(data)
                        socket.emit('update-progress', {
                            raceId,
                            userAddress: smartAccountAddress,
                            property: 'set-nickname'
                        });
                        setModalIsOpen(true);
                        setModalType("nickname-set");
                        pause();
                    });
                });
            }
        }
    }

    // fetch nickname from server
    useEffect(() => {
        if (smartAccountAddress && inputRef.current) {
            httpGetUserDataByAddress(smartAccountAddress).then(({data}) => {
                console.log("USER", data.user)
                if (data.user) {
                    inputRef.current && (inputRef.current.value = data.user.name)
                }
                inputRef.current && inputRef.current.focus();
            });
        }
    }, [smartAccountAddress, inputRef.current])

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

            socket.on('joined', ({ raceId: raceIdSocket, userAddress, part }) => {
                console.log("JOINED", raceIdSocket, raceId);
                if (raceId == raceIdSocket && part == "ADD_NAME") {
                    console.log("JOINED++")
                    setAmountOfConnected(amountOfConnected + 1);
                    if ((amountOfConnected + 1 >= location.state.amountOfRegisteredUsers) && modalType !== "nickname-set") {
                        setModalIsOpen(false);
                        setModalType(undefined);
                    }
                    socket.emit("get-connected", { raceId });
                }
            });

            socket.on('leaved', ({ part, raceId: raceIdSocket, movedToNext }) => {
                if (part == "ADD_NAME" && raceId == raceIdSocket && !movedToNext) {
                    console.log("LEAVED")
                    setAmountOfConnected(amountOfConnected - 1);
                    if (!modalIsOpen) {
                        setModalIsOpen(true);
                        setModalType("waiting");
                    }
                }
            });

            socket.on('progress-updated', ({raceId: raceIdSocket, property, value, userAddress, rProgress}) => {
                if (property == "set-nickname" && raceId == raceIdSocket) {
                    console.log("SET-NICKNAME++")
                    setAmountOfNextClicked(prev => prev + 1);

                    if (amountOfNextClicked + 1 == location.state.amountOfRegisteredUsers) {
                        socket.emit('minimize-live-game', { part: 'ADD_NAME', raceId });
                        navigate(generateLink("RACE_UPDATE_1", Number(raceId)), {
                            state: location.state
                        });
                    }
                }
            });
        
            return () => {
                socket.off('joined');
                socket.off('amount-of-connected');
                socket.off('leaved');
                socket.off('progress-updated');
            }
        }
    }, [socket, raceId, smartAccountAddress, amountOfConnected, amountOfNextClicked, location.state]);

    useEffect(() => {
        setModalIsOpen(true);
        setModalType("waiting");
        if (smartAccountAddress && location.state) {
            socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
        }
    }, [socket, raceId, smartAccountAddress, location.state]);


    useEffect(() => {
        if(smartAccountAddress && String(raceId).length) {
            if (!socket.connected) {
                socket.connect();
            }
            socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: "ADD_NAME" });
        }
    }, [smartAccountAddress, socket, raceId]);


    return (
        <div className="mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom">
            <div className="w-full bg-gray-200 h-2.5 dark:bg-gray-700">
                <div className="bg-yellow-500 h-2.5 transition-all duration-300" style={{width: `${totalSeconds * 6.66}%`}}></div>
            </div>
            <div className="mt-7 flex w-full justify-center">
                <RibbonLabel text="CHOOSE NAME"/>
            </div>
            <div className="h-full w-screen flex flex-col gap-3 px-10 mt-4 relative">
                <Rule text="NICKNAME MAXIMUM LENGTH MUST BE 10"/>
                <input ref={inputRef} type="text" className="z-20 p-2 rounded-xl border-0 text-center font-[Berlin-Bold] bg-transparent text-[14px] absolute bottom-44 left-12 w-[90px]"></input>
                <img src={ChooseNameSheep} alt="name-sheep" className="absolute bottom-20 w-[280px] left-[-50px]"/>
            </div>
            
            <div className="absolute bottom-0 right-0 w-[40%]">
                <button
                className="absolute mt-[14px] w-full -rotate-12 text-center font-[Berlin-Bold] text-[25px] text-[#18243F] hover:text-white"
                onClick={handleSubmitNickname}
                >
                    Confirm
                </button>
                <img src={NextFlag} alt="next-flag" />
            </div>
            {
                
                modalIsOpen && ["waiting", "nickname-set"].includes(modalType as string) && 
                <WaitingForPlayersModal 
                    numberOfPlayers={amountOfConnected} 
                    numberOfPlayersRequired={location?.state?.amountOfRegisteredUsers || 9}
                    replacedText="..."
                />
            }
        </div>
    );
}