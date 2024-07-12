// @ts-nocheck

import React, { useEffect, useMemo, useState } from "react";
import RibbonLabel from "../components/RibbonLabel";
import RaceItem from "../components/RaceItem";
// import { useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
// import { BLOCK_SHEEP_CONTRACT } from "../constants";
// import BlockSheep from "../contracts/BlockSheep";
// import { Race } from "../types";
// import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import { usePrivy } from "@privy-io/react-auth";
import { useNextGameId, useRacesWithPagination } from "../hooks/useRaces";
import { getRacesWithPagination } from "../utils/contract-functions";

const modalStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
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
  
  useEffect(() => {
    //console.log(user?.wallet?.address)
    if (user?.wallet?.address) {
      getRacesWithPagination(user.wallet.address, 0).then(data => {
        setRaces(data);
        console.log("RACES:", data);
      });
    }
  }, [user?.wallet?.address])

  const selectedRace = useMemo(() => {
    if (!races) {
      return undefined;
    }
    return races.find(({ id }) => id === raceId);
  }, [races, raceId]);

  function onClickJoin(id: number) {
    setRaceId(id);
    setIsOpen(true);
  }

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
          races.map((e, i) => (
            // <RaceItem key={i.toString()} race={e} onClickJoin={() => onClickJoin(e.id)} />
            <RaceItem
              key={i.toString()}
              race={e}
              onClickJoin={() => {
                navigator("/countdown");
              }}
            />
          ))}
      </div>

      {/* <Modal
        isOpen={modalIsOpen}
        onAfterOpen={afterOpenModal}
        onRequestClose={closeModal}
        style={modalStyles}
        contentLabel="JoinModal"
      >
        <button onClick={closeModal}>close</button>
        {selectedRace && <p>Race starts at {selectedRace.startAt.toString()}</p>}
      </Modal> */}
    </div>
  );
}

export default SelectRaceScreen;
