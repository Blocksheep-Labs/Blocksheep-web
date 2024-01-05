

import TinderCard from "react-tinder-card"
import PlayCard from "../assets/gameplay/card-top-bg.png"
import BottomYellowBg from "../assets/gameplay/bottom-yellow-top.svg";

import { RefObject, forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react"
import React from "react"

type Direction = 'left' | 'right' | 'up' | 'down'

export interface API {
  swipe(dir?: Direction): Promise<void>
  restoreCard(): Promise<void>
}

const questions = [
  {
    "question": "Is it better to have nice or smart kids?",
    "right": "smart",
    "left": "nice",
  },
  {
    "question": "Would you rather explore the depths of the ocean or outer space?",
    "right": "ocean",
    "left": "space",
  },
  {
    "question": "Would you rather read minds or being able to teleport?",
    "right": "read",
    "left": "teleport",
  },
]

const Content = ({ question }: {question: string}) => (
  <div className="flex h-[100%] items-center justify-center bg-[#FFEEB9]">
    <p className="text-xl p-3 z-20 text-center font-[Berlin]">
      {question}
    </p>
  </div>
)

export type SwipeSelectionProps = {
  onSwipe: () => void;
  onFinish: () => void;
}

const SwipeSelection = forwardRef<unknown, SwipeSelectionProps>(({ onSwipe, onFinish }, ref) => {
  const [data, setData] = useState(questions)
  const [currentIndex, setCurrentIndex] = useState(data.length - 1)
  const [lastDirection, setLastDirection] = useState<Direction>()
  // used for outOfFrame closure
  const currentIndexRef = useRef<number>(currentIndex)

  useImperativeHandle(ref, () => {
    return {
      swipeLeft() {
        swipe('left')
      },
      swipeRight() {
        swipe('right')
      },
    }
  })

  const childRefs: RefObject<API>[] = useMemo(
    () =>
      Array(data.length)
        .fill(0)
        .map((i) => React.createRef()),
    []
  )

  const updateCurrentIndex = (val: number) => {
    setCurrentIndex(val)
    currentIndexRef.current = val
  }

  const canGoBack = currentIndex < data.length - 1

  const canSwipe = currentIndex >= 0

  // set last direction and decrease current index
  const swiped = (direction: Direction, nameToDelete: string, index: number) => {
    setLastDirection(direction)
    updateCurrentIndex(index - 1)
    
  }

  const outOfFrame = (name: string, idx: number) => {
    console.log(`${name} (${idx}) left the screen!`, currentIndexRef.current)
    // handle the case in which go back is pressed before card goes outOfFrame
    currentIndexRef.current >= idx && childRefs[idx].current?.restoreCard()
    // TODO: when quickly swipe and restore multiple times the same card,
    // it happens multiple outOfFrame events are queued and the card disappear
    // during latest swipes. Only the last outOfFrame event should be considered valid

    if (idx > 0) {
      onSwipe()
    } else {
      onFinish()
    }
  }

  const swipe = async (dir: Direction) => {
    if (canSwipe && currentIndex < data.length) {
      await childRefs[currentIndex].current?.swipe(dir) // Swipe the card!
    }
  }

  // increase current index and show card
  const goBack = async () => {
    if (!canGoBack) return
    const newIndex = currentIndex + 1
    updateCurrentIndex(newIndex)
    await childRefs[newIndex].current?.restoreCard()
  }

  return (
    <div className="relative py-2">
      <div className='cardContainer'>
        {data.map(({question, left, right}, index) => (
          <TinderCard
            ref={childRefs[index]}
            className='swipe scale-50'
            key={question}
            onSwipe={(dir) => swiped(dir, question, index)}
            onCardLeftScreen={() => outOfFrame(question, index)}
            swipeRequirementType="position"
            preventSwipe={['up', 'down']}
          >
            <div className="m-[12px]">
              <div className="relative">
                <img src={PlayCard} alt="play-card" />
                <img src={BottomYellowBg} alt="bottom-yellow-top" className="absolute bottom-0 left-0 right-0"/>
              </div>
              <Content question={question} />
            </div>
          </TinderCard>
        ))}
      </div>
    </div>
  )
})

export default SwipeSelection