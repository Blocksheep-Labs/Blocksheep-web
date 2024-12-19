import TinderCard from "react-tinder-card";
import { RefObject, forwardRef, useImperativeHandle, useRef } from "react";
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
  onFinish: () => void;
  leftAction: (qIndex: number) => void;
  rightAction: (qIndex: number) => void;
  questions: any[]; // Array of questions
  currentQuestionIndex: number; // Index of the current question
  disabled: boolean;
};

// eslint-disable-next-line react/display-name
const SwipeSelection = forwardRef<unknown, SwipeSelectionProps>(
  ({ leftAction, rightAction, questions, currentQuestionIndex, disabled }, ref) => {
    useImperativeHandle(ref, () => ({
      swipeLeft() {
        swipe("left");
      },
      swipeRight() {
        swipe("right");
      },
    }));

    const cardRef: RefObject<API> = useRef(null);

    const swiped = (direction: Direction, index: number) => {
      // Handle swipe direction
      if (direction === "left") {
        leftAction(index);
      } else if (direction === "right") {
        rightAction(index);
      }
    };

    const swipe = async (dir: Direction) => {
      console.log("SWIPE CURRENT INDEX", { currentQuestionIndex });
      await cardRef.current?.swipe(dir); // Swipe the card!
    };

    return (
      <div className={`${disabled && "opacity-0"} duration-300 relative py-2 relative-container transition-all`}>
        {questions.map((question, index) => (
          <TinderCard
            key={index}
            className={`swipe w-64 transition-transform duration-300 ${
              index === currentQuestionIndex ? "z-10" : "z-0"
            } ${index === currentQuestionIndex ? "opacity-100" : "opacity-0"}`}
            ref={index === currentQuestionIndex ? cardRef : undefined}
            onSwipe={
              !disabled && index === currentQuestionIndex
                ? (dir) => swiped(dir, index)
                : undefined
            }
            swipeRequirementType="position"
            preventSwipe={!disabled ? ["up", "down"] : ["up", "down", "left", "right"]}
          >
            <div className="rounded-xl bg-[#3d4c6f] p-[14px]" id="tinderCardContainer">
              <LazyImage src={question.info.imgUrl} />
              <Content question={question.info.content} />
            </div>
          </TinderCard>
        ))}
      </div>
    );
  }
);

export default SwipeSelection;
