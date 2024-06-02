import React, { useEffect, useState } from "react";

function Darkness({ phase }) {
  const [left, setLeft] = useState("100%");
  const [visibility, setVisibility] = useState("hidden");

  useEffect(() => {
    if (phase === "CloseTunnel") {
      setVisibility("visible");
      setLeft("-10%"); // Cover the screen
    } else if (phase === "OpenTunnel") {
      setLeft("-110%"); // Move off-screen to the left
    } else if (phase === "Reset") {
      setVisibility("hidden");
      setLeft("100%");
    }
  }, [phase]);

  return (
    <div
      className="darkness"
      style={{ visibility, left, position: "absolute", top: 0, bottom: 0, right: 0 }}
    ></div>
  );
}

export default Darkness;
