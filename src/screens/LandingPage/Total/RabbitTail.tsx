import { useEffect } from "react";

export const RabbitTail = ({ phase }: { phase: string }) => {
  useEffect(() => {
    const tail = document.querySelector(".rabbit-tail") as HTMLElement;
    if (phase === "OpenTunnel") {
      tail.style.visibility = "visible";
      tail.style.transform = "translateX(-100vw)";
      setTimeout(() => {
        tail.style.transform = "translateX(-100vw) rotate(-25deg) translateY(-20px)";
      }, 1500);

      setTimeout(() => {
        tail.style.transform = "translateX(-150vw)";
      }, 5000);
    } else if (phase === "Reset") {
      tail.style.visibility = "hidden";
      tail.style.transform = "translateX(0) rotate(0) translateY(0)";
    }
  }, [phase]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="rabbit-tail" src="https://i.ibb.co/3FG2ch1/flufflytail.png" alt="Rabbit Tail" />
  );
};
