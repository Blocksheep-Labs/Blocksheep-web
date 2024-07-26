import React, { useState } from "react";

const TunnelChange = () => {
  const [phase, setPhase] = useState("Default");

  const handleTunnelChange = () => {
    setPhase("CloseTunnel"); // Close tunnel: Head moves to swallow everything. Open tunnel: cars get out
    setTimeout(() => setPhase("OpenTunnel"), 5000);
    setTimeout(() => setPhase("Reset"), 16000);
  };

  return <button onClick={handleTunnelChange}>Change Tunnel</button>;
};

export default TunnelChange;
