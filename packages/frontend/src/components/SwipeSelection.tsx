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
  leftAction: () => void;
  rightAction: () => void;
  questions: any[];
  currentQuestionIndex: number;
  disabled: boolean;
  leftLabel: string;
  rightLabel: string;
  completedCount: number;
};

// eslint-disable-next-line react/display-name
const SwipeSelection = forwardRef<unknown, SwipeSelectionProps>(
  ({ onSwipe, leftAction, rightAction, onFinish, questions, currentQuestionIndex, disabled, leftLabel, rightLabel, completedCount }, ref) => {
    //const currentIndexRef = useRef<number>(currentIndex);
    const swipedFlags = useRef<boolean[]>(Array(questions.length).fill(false)); // Tracks if a card has been swiped
    const [initTriggered, setInitTriggered] = useState(false);

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
        leftAction();
      } else if (direction === "right") {
        rightAction();
      }
    };

    const outOfFrame = (name: string, idx: number) => {
      console.log({idx})

      // Ensure this card is only swiped once
      if (swipedFlags.current[idx]) return;

      // Mark this card as swiped
      swipedFlags.current[idx] = true;

      if (currentQuestionIndex + 1 == questions.length) {
        onFinish();
      } else {
        onSwipe && onSwipe();
      }
    };

    const swipe = async (dir: Direction) => {
      console.log("SWIPE CURRENT INDEX", { currentQuestionIndex })
      if (currentQuestionIndex <= questions.length - 1 + completedCount) {
        await childRefs.toReversed()[currentQuestionIndex].current?.swipe(dir); // Swipe the card!
      }
    };

    console.log({questions})


    // INIT AFTER LEAVE
    /*
    useEffect(() => {
      //console.log("REF SWIPES:", childRefs.map(i => i.current?.swipe.name), childRefs.map(i => i.current?.swipe.name).every(i => i == "swipe"))
      //console.log({currentQuestionIndex, initTriggered, childRefs: childRefs.map(i => i.current?.swipe.name)})
      if (completedCount && !initTriggered && childRefs.length == questions.length && childRefs.map(i => i.current?.swipe.name).every(i => i == "swipe")) {
        console.log("SWIPE CARDS CALLED AFTER LEAVE...", completedCount)
        setInitTriggered(true);
        // 2 => [ 0, 0 ]
        new Array(completedCount).fill(0).forEach((_, key) => {
          console.log("SW FUNCTION", key, childRefs.toReversed()[key].current?.swipe);
          childRefs.toReversed()[key].current?.swipe("left");
        });
      }
    }, [completedCount, initTriggered, childRefs]);
    */

    return (
      <>
        <div className="relative py-2">
          <div className={`bg-tunnel_bg cardContainer ${disabled && 'opacity-70'}`}>
            {questions.toReversed().map(({ id, info }, index) => (
                <TinderCard
                  ref={childRefs[index]}
                  className="swipe scale-50"
                  key={id}
                  onSwipe={!disabled ? (dir) => swiped(dir, info, index) : undefined}
                  onCardLeftScreen={() => outOfFrame(info, index)}
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