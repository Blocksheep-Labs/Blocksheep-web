import TinderCard from "react-tinder-card";
import BottomYellowBg from "../assets/gameplay/bottom-yellow-top.svg";

import { RefObject, forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import React from "react";
import SelectionBtnBox from "./SelectionBtnBox";

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
      <>
        <div className="relative py-2">
          <div className={`bg-tunnel_bg cardContainer ${disabled && 'opacity-70'}`}>
            {questions.toReversed().map(({ id, info }, index) => (
                <TinderCard
                  ref={childRefs[index]}
                  className="swipe scale-50"
                  key={index}
                  onSwipe={!disabled ? (dir) => swiped(dir, info, index + completedCount) : undefined}
                  onCardLeftScreen={() => outOfFrame(info, index + completedCount)}
                  swipeRequirementType="position"
                  preventSwipe={!disabled ? ["up", "down"] : ["up", "down", "left", "right"]}
                >
                  <div className="rounded-xl bg-[#3d4c6f] p-[14px]" id="tinderCardContainer">
                    <div className="relative">
                      <img src={`/questions/question1.png`} alt="play-card" />
                      <img
                        //src="https://gateway.pinata.cloud/ipfs/bafkreicgp24henidhmn7pbghwjkkgdzd2cvmcj2tmpbp3zlbrczwvijq44"
                        src={info.imgUrl}
                        alt="bottom-yellow-top"
                        className="absolute inset-x-0 bottom-0"
                      />
                    </div>
                    <Content question={info.content} />
                  </div>
                </TinderCard>
            ))}
          </div>
        </div>
        
      </>
    );
  },
);

export default SwipeSelection;