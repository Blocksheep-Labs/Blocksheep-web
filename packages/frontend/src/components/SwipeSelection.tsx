import TinderCard from "react-tinder-card";
import BottomYellowBg from "../assets/gameplay/bottom-yellow-top.svg";

import { RefObject, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import React from "react";


type Direction = "left" | "right" | "up" | "down";

export interface API {
  // eslint-disable-next-line no-unused-vars
  swipe(dir?: Direction): Promise<void>;
  restoreCard(): Promise<void>;
}


const Content = ({ question }: { question: string }) => (
  <div className="flex h-[100%] items-center justify-center bg-[#FFEEB9]">
    <p className="z-20 p-3 text-center font-[Berlin] text-xl">{question}</p>
  </div>
);

export type SwipeSelectionProps = {
  onSwipe?: () => void;
  onFinish: () => void;
  questions: any[];
  currentQuestionIndex: number;
};

// eslint-disable-next-line react/display-name
const SwipeSelection = forwardRef<unknown, SwipeSelectionProps>(({ onSwipe, onFinish, questions, currentQuestionIndex }, ref) => {
  // const [data, setData] = useState(questions);
  const data = questions;
  const [currentIndex, setCurrentIndex] = useState(data.length - 1);
  // const [lastDirection, setLastDirection] = useState<Direction>();
  // used for outOfFrame closure
  const currentIndexRef = useRef<number>(currentIndex);

  useImperativeHandle(ref, () => {
    return {
      swipeLeft() {
        swipe("left");
      },
      swipeRight() {
        swipe("right");
      },
    };
  });

  const childRefs: RefObject<API>[] = useMemo(
    () =>
      Array(data.length)
        .fill(0)
        .map(() => React.createRef()),
    [],
  );

  const updateCurrentIndex = (val: number) => {
    setCurrentIndex(val);
    currentIndexRef.current = val;
  };

  // const canGoBack = currentIndex < data.length - 1;

  const canSwipe = currentIndex >= 0;

  // set last direction and decrease current index
  const swiped = (direction: Direction, nameToDelete: string, index: number) => {
    // setLastDirection(direction);
    updateCurrentIndex(index - 1);
  };

  const outOfFrame = (name: string, idx: number) => {
    console.log(`${name} (${idx}) left the screen!`, currentIndexRef.current);
    // handle the case in which go back is pressed before card goes outOfFrame
    currentIndexRef.current >= idx && childRefs[idx].current?.restoreCard();
    // TODO: when quickly swipe and restore multiple times the same card,
    // it happens multiple outOfFrame events are queued and the card disappear
    // during latest swipes. Only the last outOfFrame event should be considered valid

    if (idx > 0 && currentQuestionIndex + 1 !== questions.length) {
      onSwipe && onSwipe();
    } else {
      onFinish();
    }
  };

  const swipe = async (dir: Direction) => {
    if (canSwipe && currentIndex < data.length) {
      await childRefs[currentIndex].current?.swipe(dir); // Swipe the card!
    }
  };

  // increase current index and show card
  // const goBack = async () => {
  //   if (!canGoBack) return;
  //   const newIndex = currentIndex + 1;
  //   updateCurrentIndex(newIndex);
  //   await childRefs[newIndex].current?.restoreCard();
  // };


  return (
    <>
      <div className="relative py-2">
        <div className="bg-tunnel_bg cardContainer">
          {data.map(({ id, info }, index) => (
            <TinderCard
              ref={childRefs[index]}
              className="swipe scale-50"
              key={id}
              onSwipe={(dir) => swiped(dir, info, index)}
              onCardLeftScreen={() => outOfFrame(info, index)}
              swipeRequirementType="position"
              preventSwipe={["up", "down"]}
            >
              <div className="rounded-xl bg-[#3d4c6f] p-[14px]" id="tinderCardContainer">
                <div className="relative ">
                  <img src={`/questions/question${currentQuestionIndex + 1}.png`} alt="play-card" />
                  <img
                    src={data[currentQuestionIndex].info.imgUrl}
                    alt="bottom-yellow-top"
                    className="absolute inset-x-0 bottom-0"
                  />
                </div>
                <Content question={data[currentQuestionIndex].info.content} />
              </div>
            </TinderCard>
          ))}
        </div>
      </div>
    </>
  );
});

export default SwipeSelection;
