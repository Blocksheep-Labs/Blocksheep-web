// @ts-nocheck
// @ts-expect-error
// @ts-ignore
import React from "react";

function Darkness({ phase }) {
  React.useEffect(() => {
    const darkness = document.querySelector('.darkness');
    if (phase === 'CloseTunnel') {
      darkness.style.visibility = 'visible';
      darkness.style.left = '-10%'; // Cover the screen
    } else if (phase === 'OpenTunnel') {
      darkness.style.left = '-110%'; // Move off-screen to the left
      setTimeout(() => {
        darkness.style.left = '-140%'
      }, 4000);
    } else if (phase === 'Reset') {
      setTimeout(() => {
        darkness.style.visibility = 'hidden';
        darkness.style.left = '100%';
      }, 4000);
    }
  }, [phase]);

  return <div className="darkness"></div>;
}

export default Darkness;
