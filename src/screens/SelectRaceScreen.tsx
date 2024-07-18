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
import { usePrivy } from "@privy-io/react-auth";
import { useNextGameId, useRacesWithPagination } from "../hooks/useRaces";
import { getRacesWithPagination, registerOnTheRace, retreiveCOST } from "../utils/contract-functions";

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
  const navigator = useNavigate();

  const [races, setRaces] = useState([]);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [raceId, setRaceId] = useState<number | null>(null);
  const [cost, setCost] = useState(0);
  //const [selectedRace, setSelectedRace] = useState<any | null>(null);

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
      }, 10000);

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

  function onClickJoin(id: number) {
    setRaceId(id);
    setIsOpen(true);
    navigator(`/countdown/${id}`);
  }

  const onClickRegister = useCallback(async(id: number) => {
    await registerOnTheRace(id, user?.wallet?.address).then(data => {
      console.log("REGISTERED, fetching list of races...");
      fetchAndSetRaces();
    }).catch(err => {
      console.log("REG ERR:", err);
    });
    setRaceId(id);
    setIsOpen(true);
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

      <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={modalStyles}
        contentLabel="JoinModal"
      >
        <div className="w-64 h-96 md:w-96 p-5 flex flex-col gap-3 justify-center relative">
          <button onClick={closeModal} className="absolute top-5 right-5">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path fillRule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
            </svg>
          </button>
          {
            selectedRace && 
            <>
              <p className="font-bold text-xl text-center">Successfuly registered on the race</p>
              <p className="text-center">Race starts at:{' '}
                {(() => {
                  const dt = new Date(Number(selectedRace.startAt) * 1000);
                  const h = dt.getHours();
                  const m = dt.getMinutes();
                  const s = dt.getSeconds();

                  return `${h < 10 ? `0${h}` : h}:${m < 10 ? `0${m}` : m}:${s < 10 ? `0${s}` : s}`
                })()}
              </p>
              <button onClick={closeModal} className="btn bg-green-400 hover:bg-green-500 text-white font-bold p-3 rounded-xl">Confirm!</button>
            </>
          }
        </div>
      </Modal>
    </div>
  );
}

export default SelectRaceScreen;
