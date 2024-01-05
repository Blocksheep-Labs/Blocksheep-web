import ProgressGradient from "../assets/gameplay/progress-gradient.png";
import Timer from "../assets/gameplay/timer.png";

import BottomTab from '../assets/gameplay/bottom-tab.png';
import SelectionBtnBox from '../components/SelectionBtnBox';
import SwipeSelection from '../components/SwipeSelection';
import UserCount from '../components/UserCount';
import { RefObject, useEffect, useRef, useState } from "react";
import LoadingModal from "../components/LoadingModal";
import WinModal from "../components/WinModal";

export interface SwipeSelectionAPI {
  swipeLeft: () => void;
  swipeRight: () => void;
}

type ModalType = 'loading' | 'win'

function PlayScreen() {
  const ref: RefObject<SwipeSelectionAPI> = useRef(null);
  const [roundId, setRoundId] = useState(0)
  const [modalType, setModalType] = useState<ModalType | undefined>(undefined)
  const [modalIsOpen, setIsOpen] = useState(false);
  const onClickLike = () => {
    ref.current?.swipeRight();
  }
  const onClickDislike = () => {
    ref.current?.swipeLeft();
  }

  function openLoadingModal() {
    setIsOpen(true);
    setModalType('loading')
  }

  function closeLoadingModal() {
    setIsOpen(false);
    setModalType(undefined)
  }

  function openWinModal() {
    setIsOpen(true);
    setModalType('win')
  }

  function closeWinModal() {
    setIsOpen(false);
    setModalType(undefined)
    setRoundId(roundId + 1);
  }

  useEffect(() => {
    if (modalIsOpen && modalType === 'loading') {
      const timer = setTimeout(closeLoadingModal, 2000)
      return () => {
        clearTimeout(timer);
      }
    }
  }, [modalIsOpen, modalType])
  
  return (
    <div className="flex flex-col mx-auto w-full h-dvh bg-play_pattern bg-cover bg-bottom">
      <div className='relative my-4'>
        <div className='w-[54%] mx-auto flex flex-col items-center'>
          <img src={Timer} alt="" className='w-4 mb-2'/>
          <div className='bg-white'>
            <img src={ProgressGradient} alt="" className='w-[65%]'/>
          </div>
        </div>
        <div className='absolute top-0 right-4'>
          <UserCount />
        </div>
      </div>
      <SwipeSelection key={roundId} ref={ref} onSwipe={openLoadingModal} onFinish={openWinModal}/>
      <div className='w-[65%] mx-auto my-auto mb-6'>
        <SelectionBtnBox leftLabel='yes' rightLabel='no' leftAction={onClickLike} rightAction={onClickDislike}/>
      </div>
      <div className='self-end'>
        <img src={BottomTab} alt="" className='w-full'/>
      </div>

      {modalIsOpen && (modalType === 'loading' ? <LoadingModal /> : <WinModal handleClose={closeWinModal} /> )}
    </div>
  )
}

export default PlayScreen