import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { socket } from "../../utils/socketio";
import { useSmartAccount } from "../../hooks/smartAccountProvider";
import { useTimer } from "react-timer-hook";
import WaitingForPlayersModal from "../../components/modals/WaitingForPlayersModal";
import generateLink from "../../utils/linkGetter";
import StoryVideo from "../../assets/stories/sh.mp4";
import { httpGetRaceDataById } from "../../utils/http-requests";


const videos = [
    StoryVideo,
    StoryVideo,
    StoryVideo,
    StoryVideo,
    StoryVideo
];


const getStoryText = (part: string, pos: number) => {
    const textParts = {
        intro: [
            "In the silence between breaths, a signal ignites; the world awakens to the hum of possibility.",
            "Beyond the veil of today lies a canvas of infinite tomorrow; the journey begins with a single spark.",
            "At the edge of silence, a pulse awakens; the heartbeat of a new journey resonates within.",
            "Engines ignite; the world vibrates. A symphony of motion begins.",
            "Where does the journey take us? The beat starts. We move.",
        ],
        part1: [
            "We are voyagers on roads uncharted, guided by the pulse of neon veins. Trust the path beneath, for every mile reveals a fragment of ourselves.",
            "We stand at the crossroads of possibility, where ambition meets the endless sky. The future calls, a melody of untold stories.",
            "We traverse the labyrinth of time, threads of light weaving our stories. Trust in the unseen currents that carry us beyond the now.",
            "We are sparks in the machine, racing against the wind. Heartbeats sync with the rhythm of the road.",
            "Can you feel it? The pulse of the road. Can you feel it? The call to go.",
        ],
        part2: [
            "In a world of endless circuits, technology is our compass. We fuse with the machine, transcending limits, chasing echoes of the future.",
            "With eyes on the stars, we race towards horizons unseen. Trust in the wings of hope to carry you above the clouds.",
            "With technology as our compass, we navigate the seas of possibility. Boundaries blur as we merge with the rhythm of the digital tide.",
            "Technology blurs the lines; wheels and hooves become one. Trust the momentum, embrace the speed.",
            "We run together, we run alone. We run together, into the unknown.",
        ],
        part3: [
            "Breaking from the flock, the lone sheep runs. No longer bound by the rhythm of others, it carves its own destiny amidst digital skies.",
            "In the realm where sheep dream, they ascend on paths of light. Technology and spirit unite, breaking chains of the ordinary.",
            "A lone sheep steps away from the fold, not lost but seeking. In the vast expanse, it discovers the echoes of its own voice.",
            "A solitary sheep stands atop a hill, contemplating the vast sky. It understands that freedom is found not in distance, but in depth.",
            "What drives you forward? Is it the thrill? What drives you forward? A dream to fulfill?",
        ],
        part4: [
            "The race is eternal, not to conquer but to become. Each finish line a new beginning, each victory a step closer to infinity.",
            "Heaven is not distant but found in the pursuit. Each stride forward ignites a flame, illuminating the path to what could be.",
            "The race is a dance of shadows and light, where winning is not the end but a passage. Each stride propels us closer to the essence of being.",
            "Ambition fuels our wings as we soar through inner skies. The race is against no one but ourselves, striving to reach new heights of understanding.",
            "Sheep in motion, breaking free. Sheep in motion, you and me.",
        ],
        conclusion: [
            "And as the horizon stretches ever forward, we realize: the journey is the destination, and we are the architects of forever.",
            "As dawn breaks on a new era, we realize: the only limits are those we accept. The horizon isn't the end—it's just the beginning.",
            "As dawn breaks, we stand on the threshold of infinity, knowing that every end is a new beginning waiting to unfold.",
            "As twilight merges into dawn, we emerge from the journey within—transformed, yet ever seeking. The horizon of the soul stretches infinitely ahead.",
            "The race goes on, the beat is strong. Are you with us? Ready for the final gong.",
        ],
    }

    // @ts-ignore
    return textParts[part][pos];
}


const getStoryPart = (part: string) => {
    let story_part = "";
    switch (part) {
        case "intro": story_part = "STORY_INTRO"; break;
        case "part1": story_part = "STORY_PART_1"; break;
        case "part2": story_part = "STORY_PART_2"; break;
        case "part3": story_part = "STORY_PART_3"; break;
        case "part4": story_part = "STORY_PART_4"; break;
        case "conclusion": story_part = "STORY_CONCLUSION"; break;
        default:
            break;
    }

    return story_part;
}

export default function StoryScreen() {
    const navigate = useNavigate();
    const {raceId, part} = useParams();
    const {smartAccountAddress} = useSmartAccount();
    const location = useLocation();
    const [amountOfConnected, setAmountOfConnected] = useState(0);
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [modalType, setModalType] = useState<"waiting" | "leaving" | undefined>(undefined);
    const [storyKey, setStoryKey] = useState<number | undefined>(undefined);

    const time = new Date();
    time.setSeconds(time.getSeconds() + 6);

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

            let redirectLink = "/";
            /*
            switch (part) {
                case "intro":
                    redirectLink = generateLink("RACE_START", Number(raceId)); 
                    break;
                case "part1": 
                    redirectLink = generateLink("RABBIT_HOLE_PREVIEW", Number(raceId)); 
                    break;
                case "part2": 
                    redirectLink = generateLink("BULL_RUN_PREVIEW", Number(raceId)); 
                    break;
                case "part3": 
                    redirectLink = generateLink("RABBIT_HOLE_V2_PREVIEW", Number(raceId)); 
                    break;
                case "part4":
                    redirectLink = generateLink("STORY_CONCLUSION", Number(raceId)); 
                    break;
                case "conclusion":
                    redirectLink = generateLink("RATE", Number(raceId));
                    break;
                default:
                    break;
            }
            */

            switch (part) {
                case "intro":
                    redirectLink = generateLink("RACE_START", Number(raceId)); 
                    break;
                case "part1": 
                    redirectLink = generateLink("RABBIT_HOLE_PREVIEW", Number(raceId)); 
                    break;
                case "part2": 
                    redirectLink = generateLink("BULL_RUN_PREVIEW", Number(raceId)); 
                    break;
                case "part3": 
                    redirectLink = generateLink("RATE", Number(raceId));
                    break;
                case "part4":
                    redirectLink = generateLink("STORY_CONCLUSION", Number(raceId)); 
                    break;
                case "conclusion":
                    redirectLink = generateLink("PODIUM", Number(raceId)); 
                    break;
                default:
                    break;
            }
            
            socket.emit('minimize-live-game', { part: getStoryPart(part as string), raceId });
            navigate(redirectLink, {
                state: location.state,
                replace: true,
            });
        },
        autoStart: true
    });

    useEffect(() => {
        if (location.state && amountOfConnected === location.state.amountOfRegisteredUsers) {    
            const time = new Date();
            time.setSeconds(time.getSeconds() + 6);
            restart(time);
        } else {
            pause();
        }
    }, [amountOfConnected, location.state]);

    // handle socket events
    useEffect(() => {
        if (smartAccountAddress && location.state && part) {
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

            socket.on('joined', ({ raceId: raceIdSocket, userAddress, part: socketPart }) => {
                console.log("JOINED", raceIdSocket, raceId);
                if (raceId == raceIdSocket && socketPart == getStoryPart(part) ) {
                    console.log("JOINED++")
                    setAmountOfConnected(amountOfConnected + 1);
                    if (amountOfConnected + 1 >= location.state.amountOfRegisteredUsers) {
                        setModalIsOpen(false);
                        setModalType(undefined);
                    }
                    socket.emit("get-connected", { raceId });
                }
            });

            socket.on('leaved', ({ part: partSocket, raceId: raceIdSocket, movedToNext }) => {
                if (partSocket == getStoryPart(part) && raceId == raceIdSocket && !movedToNext) {
                    console.log("LEAVED")
                    setAmountOfConnected(amountOfConnected - 1);
                    if (!modalIsOpen) {
                        setModalIsOpen(true);
                    }
                    setModalType("waiting");
                }
            });
        
            return () => {
                socket.off('joined');
                socket.off('amount-of-connected');
                socket.off('leaved');
            }
        }
    }, [socket, raceId, smartAccountAddress, amountOfConnected, location.state, part]);

    useEffect(() => {
        if(smartAccountAddress && String(raceId).length && part) {
            httpGetRaceDataById(`race-${raceId}`).then(({data}) => {
                console.log("RACE DATA:", data);
                setStoryKey(data?.race?.storyKey || 0);
            });
            setModalIsOpen(true);
            setModalType("waiting");
            if (!socket.connected) {
                socket.connect();
            }
            socket.emit("connect-live-game", { raceId, userAddress: smartAccountAddress, part: getStoryPart(part) });
        }
    }, [smartAccountAddress, socket, raceId, part]);

    return (
        <div className="bg-white h-full relative">
            <div className="w-full bg-gray-200 h-2.5 dark:bg-gray-700">
                <div className="bg-yellow-500 h-2.5 transition-all duration-300" style={{width: `${totalSeconds * 16.66}%`}}></div>
            </div>
            {
                storyKey != undefined &&
                <video autoPlay muted className="asbolute w-full h-full object-cover" autoFocus={false} playsInline>
                    <source src={videos[storyKey]} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
            }

            <div className="absolute bottom-5 bg-black bg-opacity-50 p-5">
                <p className="text-lg text-center text-white">
                    { storyKey != undefined && getStoryText(part as string, storyKey) }
                </p>
            </div>

            {
                location.state.amountOfRegisteredUsers > amountOfConnected && 
                <WaitingForPlayersModal 
                    numberOfPlayers={amountOfConnected} 
                    numberOfPlayersRequired={location?.state?.amountOfRegisteredUsers || 9}
                />
            }
        </div>
    );
}