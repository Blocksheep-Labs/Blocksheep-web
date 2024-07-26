// @ts-nocheck

import React, { useEffect, useState } from "react";

function RabbitHead({ phase }) {
  const [transform, setTransform] = useState("translateX(0)");
  const [visibility, setVisibility] = useState("visible");

  useEffect(() => {
    if (phase === "CloseTunnel") {
      setTransform("translateX(-130vw)");
    } else if (phase === "OpenTunnel") {
      setVisibility("hidden");
      setTransform("translateX(50vw)");
    } else if (phase === "Reset") {
      setVisibility("visible");
      setTransform("translateX(0)");
    }
  }, [phase]);

  return (
    <img
      className="rabbit-head"
      src="https://i.ibb.co/pvJj4gh/rabbit.png"
      alt="Rabbit Head"
      style={{ transform, visibility }}
    />
  );
}

export default RabbitHead;
