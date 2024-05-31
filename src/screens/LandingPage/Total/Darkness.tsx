import { useEffect } from "react";

export const Darkness = ({ phase }: { phase: string }) => {
  useEffect(() => {
    const darkness = document.querySelector(".darkness") as HTMLElement;
    if (phase === "CloseTunnel") {
      darkness.style.visibility = "visible";
      darkness.style.left = "-10%"; // Cover the screen
    } else if (phase === "OpenTunnel") {
      darkness.style.left = "-110%"; // Move off-screen to the left
    } else if (phase === "Reset") {
      darkness.style.visibility = "hidden";
      darkness.style.left = "100%";
    }
  }, [phase]);

  return <div className="darkness" />;
};
