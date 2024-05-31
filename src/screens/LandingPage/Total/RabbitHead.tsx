import { useEffect } from "react";

export const RabbitHead = ({ phase }: { phase: string }) => {
  useEffect(() => {
    const head = document.querySelector(".rabbit-head") as HTMLElement;
    if (phase === "CloseTunnel") {
      head.style.transform = "translateX(-130vw)";
    } else if (phase === "OpenTunnel") {
      head.style.visibility = "hidden";
      head.style.transform = "translateX(50vw)";
    } else if (phase === "Reset") {
      head.style.visibility = "visible";
      head.style.transform = "translateX(0)";
    }
  }, [phase]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="rabbit-head" src="https://i.ibb.co/pvJj4gh/rabbit.png" alt="Rabbit Head" />
  );
};
