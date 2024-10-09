import TinderCard from "react-tinder-card";
import BottomYellowBg from "../assets/gameplay/bottom-yellow-top.svg";

import { RefObject, forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import React from "react";

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
  leftAction: () => void;
  rightAction: () => void;
  questions: any[];
  currentQuestionIndex: number;
  disabled: boolean;
};

// eslint-disable-next-line react/display-name
const SwipeSelection = forwardRef<unknown, SwipeSelectionProps>(
  ({ onSwipe, leftAction, rightAction, onFinish, questions, currentQuestionIndex, disabled }, ref) => {
    const data = questions;
    const [currentIndex, setCurrentIndex] = useState(data.length - 1);
    const swipedFlags = useRef<boolean[]>(Array(data.length).fill(false)); // Tracks if a card has been swiped

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
        Array(data.length)
          .fill(0)
          .map(() => React.createRef()),
      [data.length],
    );

    const canSwipe = currentIndex >= 0;

    const swiped = (direction: Direction, nameToDelete: string, index: number) => {
      console.log({direction})
      // Ensure this card is only swiped once
      if (swipedFlags.current[index]) return;

      // Mark this card as swiped
      swipedFlags.current[index] = true;

      // Handle swipe direction
      if (direction === "left") {
        leftAction();
      } else if (direction === "right") {
        rightAction();
      }

      // Update index after swipe
      // updateCurrentIndex(index - 1);
    };

    const outOfFrame = (name: string, idx: number) => {
      //currentIndexRef.current >= idx && childRefs[idx].current?.restoreCard();
      console.log("OUT OF FRAME", {idx});
      // Trigger onSwipe if there are more cards to swipe
      if (idx > 0) {
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

    return (
      <>
        <div className="relative py-2">
          <div className={`bg-tunnel_bg cardContainer ${disabled && 'opacity-70'}`}>
            {data.map(({ id, info }, index) => (
              <TinderCard
                ref={childRefs[index]}
                className="swipe scale-50"
                key={id}
                onSwipe={!disabled ? (dir) => swiped(dir, info, index) : undefined}
                onCardLeftScreen={!disabled ? () => outOfFrame(info, index) : undefined}
                swipeRequirementType="position"
                preventSwipe={!disabled ? ["up", "down"] : ["up", "down", "left", "right"]}
              >
                <div className="rounded-xl bg-[#3d4c6f] p-[14px]" id="tinderCardContainer">
                  <div className="relative">
                    <img src={`/questions/question${data.length - (index)}.png`} alt="play-card" />
                    <img
                      src={data[data.length - (index + 1)].info.imgUrl}
                      alt="bottom-yellow-top"
                      className="absolute inset-x-0 bottom-0"
                    />
                  </div>
                  <Content question={data[data.length - (index + 1)].info.content} />
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
