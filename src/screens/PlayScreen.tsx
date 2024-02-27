import BottomTab from "../assets/gameplay/bottom-tab.png";
import SelectionBtnBox from "../components/SelectionBtnBox";
import SwipeSelection from "../components/SwipeSelection";
import UserCount from "../components/UserCount";
import { RefObject, useEffect, useRef, useState } from "react";
import LoadingModal from "../components/LoadingModal";
import WinModal from "../components/WinModal";
import RaceModal from "../components/RaceModal";
import Timer from "../components/Timer";
import { useTimer } from "react-timer-hook";
import ReadyModal from "../components/ReadyModal";
export interface SwipeSelectionAPI {
  swipeLeft: () => void;
  swipeRight: () => void;
}

type ModalType = "ready" | "loading" | "win" | "race";

function PlayScreen() {
  const ref: RefObject<SwipeSelectionAPI> = useRef(null);
  const [roundId, setRoundId] = useState(0);
  const [modalType, setModalType] = useState<ModalType | undefined>(undefined);
  const [modalIsOpen, setIsOpen] = useState(false);
  const [progress, setProgress] = useState(
    Array.from({ length: 9 }, () => {
      return { curr: 0, delta: 0 };
    }),
  );
  const [flipState, setFlipState] = useState(true);

  const time = new Date();
  time.setSeconds(time.getSeconds() + 10);

  useEffect(() => {
    const time = new Date();
    time.setSeconds(time.getSeconds() + 10);
    restart(time);
  }, [flipState]);

  const { totalSeconds, restart } = useTimer({
    expiryTimestamp: time,
    onExpire: () => setFlipState(!flipState),
  });

  const updateProgress = () => {
    setProgress((old) =>
      old.map(({ curr, delta }) => {
        return {
          curr: (curr + delta) % 10,
          delta: Math.ceil(Math.random() * 2) % 10,
        };
      }),
    );
  };
  const onClickLike = () => {
    ref.current?.swipeLeft();
  };
  const onClickDislike = () => {
    ref.current?.swipeRight();
  };

  function openLoadingModal() {
    setIsOpen(true);
    setModalType("loading");
  }

  function closeLoadingModal() {
    setIsOpen(false);
    setModalType(undefined);
  }

  function openWinModal() {
    setIsOpen(true);
    setModalType("win");
  }

  function closeWinModal() {
    setIsOpen(false);
    setModalType(undefined);
    updateProgress();
    openRaceModal();
  }

  function openRaceModal() {
    setIsOpen(true);
    setModalType("race");
  }

  function closeRaceModal() {
    setIsOpen(false);
    setModalType(undefined);
    setRoundId(roundId + 1);
  }

  function openReadyModal() {
    setIsOpen(true);
    setModalType("ready");
  }

  function closeReadyModal() {
    setIsOpen(false);
    setModalType(undefined);
    console.log("closeReadyModal");
  }

  function onFinish() {
    openLoadingModal();
  }

  useEffect(() => {
    openReadyModal();
  }, []);

  useEffect(() => {
    if (modalIsOpen && modalType === "loading") {
      const timer = setTimeout(() => {
        closeLoadingModal();
        openWinModal();
      }, 2000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [modalIsOpen, modalType]);

  return (
    <div className="mx-auto flex h-dvh w-full flex-col bg-play_pattern bg-cover bg-bottom">
      <div className="relative my-4">
        <Timer seconds={totalSeconds} />
        <div className="absolute right-4 top-0">
          <UserCount />
        </div>
      </div>
      <SwipeSelection key={roundId.toString()} ref={ref} onFinish={onFinish} />
      <div className="m-auto mb-6 w-[65%]">
        <SelectionBtnBox
          leftLabel="yes"
          rightLabel="no"
          leftAction={onClickLike}
          rightAction={onClickDislike}
          disabled={modalIsOpen}
        />
      </div>
      <div className="self-end">
        <img src={BottomTab} alt="" className="w-full" />
      </div>

      {modalIsOpen && (
        <>
          {modalType === "ready" && <ReadyModal handleClose={closeReadyModal} />}
          {modalType === "loading" && <LoadingModal />}
          {modalType === "win" && <WinModal handleClose={closeWinModal} />}
          {modalType === "race" && <RaceModal progress={progress} handleClose={closeRaceModal} />}
        </>
      )}
    </div>
  );
}

export default PlayScreen;
