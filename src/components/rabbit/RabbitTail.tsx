// @ts-nocheck

import React, { useEffect, useState } from "react";

function RabbitTail({ phase }) {
  const [style, setStyle] = useState({
    visibility: "hidden",
    transform: "translateX(0) rotate(0) translateY(0)",
  });

  useEffect(() => {
    let timeout1, timeout2;
    if (phase === "OpenTunnel") {
      setStyle({
        visibility: "visible",
        transform: "translateX(-100vw)",
      });

      timeout1 = setTimeout(() => {
        setStyle((prevStyle) => ({
          ...prevStyle,
          transform: "translateX(-100vw) rotate(-25deg) translateY(-20px)",
        }));
      }, 1500);

      timeout2 = setTimeout(() => {
        setStyle((prevStyle) => ({
          ...prevStyle,
          transform: "translateX(-150vw)",
        }));
      }, 5000);
    } else if (phase === "Reset") {
      setStyle({
        visibility: "hidden",
        transform: "translateX(0) rotate(0) translateY(0)",
      });
    }

    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
  }, [phase]);

  return (
    <img
      className="rabbit-tail"
      src="https://i.ibb.co/3FG2ch1/flufflytail.png"
      alt="Rabbit Tail"
      style={style}
    />
  );
}

export default RabbitTail;
