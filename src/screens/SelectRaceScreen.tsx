// @ts-nocheck

import React, { useMemo, useState } from "react";
import RibbonLabel from "../components/RibbonLabel";
import RaceItem from "../components/RaceItem";
// import { useAddress, useContract, useContractRead } from "@thirdweb-dev/react";
// import { BLOCK_SHEEP_CONTRACT } from "../constants";
// import BlockSheep from "../contracts/BlockSheep";
// import { Race } from "../types";
// import Modal from "react-modal";
import { useNavigate } from "react-router-dom";

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
  // const address = useAddress();
  // const { contract: blockSheep } = useContract(BLOCK_SHEEP_CONTRACT, BlockSheep);
  // const { data: nextRaceId } = useContractRead(blockSheep, "nextRaceId", []);
  // const { data } = useContractRead(blockSheep, "getRacesWithPagination", [address, 0, nextRaceId]);

  // const races = useMemo(() => {
  //   if (!data) {
  //     return null;
  //   }
  //   return (data as Race[]).map((e, index) => {
  //     return { ...e, id: index };
  //   });
  // }, [data]);

  const navigator = useNavigate();

  const [modalIsOpen, setIsOpen] = useState(false);
  const [raceId, setRaceId] = useState<number | null>(null);
  const [races, setRace] = useState([
    {
      id: 1,
      playersCount: 2,
      numOfGames: 3,
      registered: true,
      startAt: "1716873870",
    },
    {
      id: 2,
      playersCount: 3,
      numOfGames: 4,
      registered: true,
      startAt: "1716873870",
    },
    {
      id: 3,
      playersCount: 4,
      numOfGames: 5,
      registered: true,
      startAt: "1716873870",
    },
  ]);

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
