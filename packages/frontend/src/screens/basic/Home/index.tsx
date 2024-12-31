// import { ConnectWallet, useAddress } from "@thirdweb-dev/react";
// import React, { useEffect } from "react";
// import { useNavigate } from "react-router-dom";
import BlockSheepLogo from "../../assets/home/black sheepy.png";
import Sheep from "../../assets/home/sheep itself.png";
import SheepShadow from "../../assets/home/sheep shadow.png";
import FlagYellow from "../../assets/home/Layer 8.png";
import FlagGreen from "../../assets/home/Layer 12.png";
import { useEffect, useRef, useState } from "react";
import { useLinkWithSiwe, useLogin, usePrivy } from "@privy-io/react-auth";
import { useSmartAccount } from "../../../hooks/smartAccountProvider";
import { SELECTED_NETWORK } from "../../../config/constants";
import { useNavigate } from "react-router-dom";
import SetNicknameModal from "../../../components/modals/SetNicknameModal";
import { httpGetUserDataByAddress, httpSetNameByAddress } from "../../../utils/http-requests";
import FrameEdges from "./components/frame-edges";
import UniqueRaceAnimation from "./components/race-animation";


function HomeScreen() {
    const navigate = useNavigate();
    const [nicknameModalIsOpen, setNicknameModalIsOpen] = useState(false);
    const { smartAccountAddress, smartAccountClient } = useSmartAccount();
    const { generateSiweMessage, linkWithSiwe } = useLinkWithSiwe();
    const { login } = useLogin({
        onComplete: async(user) => {
        console.log("LOGGED IN AS:", user);
        }
    });
    const { logout } = usePrivy();



    const linkAccount = async() => {
        console.log(smartAccountAddress, smartAccountClient)
        if (!smartAccountClient || !smartAccountAddress) return;

        const chainId = `eip155:${SELECTED_NETWORK.id}`;
        const message = await generateSiweMessage({
        address: smartAccountAddress,
        chainId
        });
        const signature = await smartAccountClient.signMessage({message});

        try {
            await linkWithSiwe({
                signature,
                message,
                chainId,
                //walletClientType: 'privy_smart_account',
                connectorType: 'safe'
            });
        } catch (error) {
            setNicknameModalIsOpen(false);
        } finally {
            await httpGetUserDataByAddress(smartAccountAddress).then(({data}) => {
                if (!data?.user?.name) {
                    setNicknameModalIsOpen(true);
                } else {
                    navigate('/select');
                }
            });
        }
    }


    const handleCloseNicknameModal = (nickname: string) => {
        setNicknameModalIsOpen(false);
        httpSetNameByAddress(nickname, smartAccountAddress as `0x${string}`).finally(() => {
        navigate('/select');
        });
    }

    const handleLoginClick = () => {
        login();
        setTimeout(() => {
            const wrapper = document.querySelector('[id^="headlessui-dialog-panel-"]') as HTMLDivElement | null;
            const el = document.querySelector("#privy-modal-content") as HTMLDivElement | null;
            if (el && wrapper && window.innerWidth <= 440) {
                wrapper.style.transition = 'all 0.5s';
                wrapper.style.padding = '15px';
                el.style.transition = 'all 0.5s';
                el.style.marginBottom = '200px';
                el.style.borderRadius = '18px';
            };
        }, 500);
    }


    return (
        <div className="bg-transparent" style={{ height: `${window.innerHeight}px` }}>
            { nicknameModalIsOpen && <SetNicknameModal handleClose={handleCloseNicknameModal}/> }
            <UniqueRaceAnimation 
                handleClick={() => {
                    if (!smartAccountAddress || !smartAccountClient) {
                        handleLoginClick();
                    } else {
                        linkAccount();
                    }
                }}
            />
            <FrameEdges/>
            
            {
                smartAccountAddress && smartAccountClient &&
                <div className="absolute bottom-2 right-2" onClick={logout}>Logout</div>
            }
        </div>
    );
}

export default HomeScreen;
