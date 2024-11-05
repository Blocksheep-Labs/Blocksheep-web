import TinderCard from "react-tinder-card";
import BottomYellowBg from "../assets/gameplay/bottom-yellow-top.svg";

import { RefObject, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import React from "react";
import SelectionBtnBox from "./SelectionBtnBox";
import LazyImage from "./image-loading/lazy-image";

type Direction = "left" | "right" | "up" | "down";

export interface API {
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
  leftAction: (qIndex: number) => void;
  rightAction: (qIndex: number) => void;
  questions: any[];
  currentQuestionIndex: number;
  disabled: boolean;
  completedCount: number;
};

// eslint-disable-next-line react/display-name
const SwipeSelection = forwardRef<unknown, SwipeSelectionProps>(
  ({ onSwipe, leftAction, rightAction, onFinish, questions, currentQuestionIndex, disabled, completedCount }, ref) => {
    //const currentIndexRef = useRef<number>(currentIndex);
    const swipedFlags = useRef<boolean[]>(Array(questions.length).fill(false)); // Tracks if a card has been swiped

    useImperativeHandle(ref, () => ({
      swipeLeft() {
        swipe("left");
      },
      swipeRight() {
        swipe("right");
      },
    }));

    const childRefs: RefObject<API>[] = useMemo(
      () =>
        Array(questions.length)
          .fill(0)
          .map(() => React.createRef()),
      [questions.length],
    );


    const swiped = (direction: Direction, nameToDelete: string, index: number) => {
      console.log("SWIPE FN CALL:", {direction, index})

      // Handle swipe direction
      if (direction === "left") {
        leftAction(index);
      } else if (direction === "right") {
        rightAction(index);
      }
    };

    const outOfFrame = (name: string, idx: number) => {
      console.log({idx})

      // Ensure this card is only swiped once
      if (swipedFlags.current[idx]) return;

      // Mark this card as swiped
      swipedFlags.current[idx] = true;

      if (currentQuestionIndex == 2) {
        console.log(">>>>>>>>>>>>>> FINISH OUT OF FRAME <<<<<<<<<<<<<")
        onFinish();
      } else {
        onSwipe && onSwipe();
      }
    };

    const swipe = async (dir: Direction) => {
      console.log("SWIPE CURRENT INDEX", { currentQuestionIndex: currentQuestionIndex - completedCount })
      if (currentQuestionIndex <= questions.length - 1 + completedCount) {
        await childRefs.toReversed()[currentQuestionIndex - completedCount].current?.swipe(dir); // Swipe the card!
      }
    };

    return (

        <div className={`${disabled && 'opacity-0'} relative py-2 relative-container transition-all`}>
          {questions.toReversed().map(({ id, info }, index) => (
            <TinderCard
              ref={childRefs[index]}
              className="swipe w-64"
              key={index}
              onSwipe={!disabled ? (dir) => swiped(dir, info, index + completedCount) : undefined}
              onCardLeftScreen={() => outOfFrame(info, index + completedCount)}
              swipeRequirementType="position"
              preventSwipe={!disabled ? ["up", "down"] : ["up", "down", "left", "right"]}
            >
              <div className="rounded-xl bg-[#3d4c6f] p-[14px]" id="tinderCardContainer">
                <LazyImage src={info.imgUrl}/>
                <Content question={info.content} />
              </div>
            </TinderCard>
          ))}
        </div>
 
    );
  },
);

export default SwipeSelection;