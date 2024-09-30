import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTimer } from "react-timer-hook";
import { socket } from "../../utils/socketio";
import RibbonLabel from "../../components/RibbonLabel";
import Rule from "../../components/Rule";
import WaitingForPlayersModal from "../../components/modals/WaitingForPlayersModal";
import { useEffect, useRef, useState } from "react";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import NextFlag from "../../assets/common/flag.png";
import { httpGetUserDataByAddress, httpRaceInsertUser, httpSetNameByAddress } from "../../utils/http-requests";


export default function SetNicknameScreen() {
    const navigate = useNavigate();
    const {raceId} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const location = useLocation();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [amountOfNextClicked, setAmountOfNextClicked] = useState(0);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalType, setModalType] = useState<"waiting" | "leaving" | undefined>(undefined);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const handleSubmitNickname = () => {
        if (inputRef.current) {
            const nickname = inputRef.current.value;

            if (nickname.length > 0 && nickname.length < 10 && smartAccountAddress) {
                // TODO: SET NICKNAME with http req
                httpSetNameByAddress(nickname, smartAccountAddress).then(({data}) => {
                    httpRaceInsertUser(`race-${raceId}`, data.user._id).then(({data}) => {
                        console.log(data)
                        socket.emit('update-progress', {
                            raceId,
                            userAddress: smartAccountAddress,
                            property: 'set-nickname'
                        });
                    })
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

            socket.on('progress-updated', ({raceId: raceIdSocket, property, value, userAddress, rProgress}) => {
                if (property == "set-nickname" && raceId == raceIdSocket) {
                    console.log("SET-NICKNAME++")
                    setAmountOfNextClicked(prev => prev + 1);

                    if (amountOfNextClicked + 1 == location.state.amountOfRegisteredUsers) {
                        setModalIsOpen(true);
                        setModalType("waiting");
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
        socket.emit("get-connected", { raceId });
        socket.emit("get-progress", { raceId, userAddress: smartAccountAddress });
        }
    }, [socket, raceId, smartAccountAddress, location.state]);


    return (
        <div className="mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom">
            <div className="mt-7 flex w-full justify-center">
                <RibbonLabel text="SET NICKNAME"/>
            </div>
            <div className="h-full flex flex-col gap-3 px-10 mt-4">
                <Rule text="IT IS REQUIRED TO SET A NICKNAME TO MOVE TO NEXT STEP"/>
                <input ref={inputRef} type="text" className="p-2 rounded-xl border-[2px] border-black text-center font-[Berlin-Bold] text-[20px]"></input>
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
                
                modalIsOpen && modalType === "waiting" && 
                <WaitingForPlayersModal 
                    numberOfPlayers={amountOfConnected} 
                    numberOfPlayersRequired={location?.state?.amountOfRegisteredUsers || 9}
                    replacedText="..."
                />
            }
        </div>
    );
}