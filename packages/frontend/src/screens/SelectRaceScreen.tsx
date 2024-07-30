// @ts-nocheck

import React, { useCallback, useEffect, useMemo, useState } from "react";
import RibbonLabel from "../components/RibbonLabel";
import RaceItem from "../components/RaceItem";
// import { useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
// import { BLOCK_SHEEP_CONTRACT } from "../constants";
// import BlockSheep from "../contracts/BlockSheep";
// import { Race } from "../types";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useNextGameId, useRacesWithPagination } from "../hooks/useRaces";
import { getRacesWithPagination, registerOnTheRace, retreiveCOST } from "../utils/contract-functions";
import RegisteringModal from "../components/RegisteringModal";
import RegisteredModal from "../components/RegisteredModal";


const modalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    padding: 0,
    borderRadius: '16px',
    boxShadow: '10px 10px 100px #a6c548'
  },
  overlay: {
    backdropFilter: "blur(5px)",
    backgroundColor: "rgba(253,255,255,0.44)",
  },
};

function SelectRaceScreen() {
  const { user } = usePrivy();
  const { wallets } = useWallets();
  const navigator = useNavigate();

  const [races, setRaces] = useState([]);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [raceId, setRaceId] = useState<number | null>(null);
  const [cost, setCost] = useState(0);
  const [modalType, setModalType] = useState<"registering" | "registered" | undefined>(undefined);
  //const [selectedRace, setSelectedRace] = useState<any | null>(null);

  // switch chain if required
  useEffect(() => {
    if (user?.wallet?.address.length && wallets.length) {

      const processSwitch = async() => {
        // find connected wallet and switch chain
        const wallet = wallets.find((wallet) => wallet.address === user.wallet?.address);
        if (wallet?.chainId !== "eip155:97") {
          await wallet?.switchChain(97);
        }
      }

      processSwitch();
    }
  }, [user?.wallet, wallets]);

  const fetchAndSetRaces = useCallback(async() => {
    if (user?.wallet?.address) {
      getRacesWithPagination(user.wallet.address, 0).then(data => {
        setRaces(data);
      });
      setCost(await retreiveCOST());
    }
  }, [user?.wallet?.address]);
  
  useEffect(() => {
    if (user?.wallet?.address) {
      fetchAndSetRaces();
      
      const intId = setInterval(() => {
        fetchAndSetRaces();
      }, 5000);

      return () => {
        clearInterval(intId);
      }
    }
  }, [user?.wallet?.address]);

  const selectedRace = useMemo(() => {
    if (!races) {
      return undefined;
    }
    return races.find(({ id }) => id === raceId);
  }, [races, raceId]);

  const onClickJoin = useCallback((id: number) => {
    if (user?.wallet?.address) {
      setRaceId(id);
      setIsOpen(true);
      navigator(`/countdown/${id}`);
    }
  }, [raceId, user?.wallet?.address])

  const onClickRegister = useCallback(async(id: number, questionsCount: number) => {
    setIsOpen(true);
    setModalType("registering");
    await registerOnTheRace(id, questionsCount).then(data => {
      console.log("REGISTERED, fetching list of races...");
      fetchAndSetRaces();
      setRaceId(id);
      setIsOpen(true);
      setModalType("registered");
    }).catch(err => {
      setModalType(undefined);
      setIsOpen(false);
      console.log("REG ERR:", err);
    });
  }, [user?.wallet?.address]);

  function afterOpenModal() {
    // references are now sync'd and can be accessed.
    // subtitle.style.color = "#f00";
  }

  function closeModal() {
    setIsOpen(false);
    setRaceId(null);
  }

  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-race_bg bg-cover bg-bottom">
      <div className="mt-16 flex w-full justify-center">
        <RibbonLabel />
      </div>
      <div className="mx-8 my-4 flex h-3/5 flex-col gap-20 overflow-y-auto pt-4">
        {races &&
          races.map((r, i) => (
            <RaceItem
              key={i.toString()}
              cost={cost}
              race={r}
              onClickJoin={onClickJoin}
              onClickRegister={onClickRegister}
            />
          ))}
      </div>

      { modalIsOpen && modalType === "registering" && <RegisteringModal/> }
      { modalIsOpen && modalType === "registered"  && <RegisteredModal handleClose={closeModal} timeToStart={(() => {
          const dt = new Date(Number(selectedRace.startAt) * 1000);
          const h = dt.getHours();
          const m = dt.getMinutes();
          const s = dt.getSeconds();
          return `${h < 10 ? `0${h}` : h}:${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`
        })()}/>  
      }
    </div>
  );
}

export default SelectRaceScreen;
