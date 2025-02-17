// @ts-nocheck

import React from "react";
import RabbitTailImage from "../../assets/images/flufflytail.png"

function RabbitTail({ phase }) {
  React.useEffect(() => {
    const tail = document.querySelector('.rabbit-tail');
    if (phase === 'OpenTunnel') {
      tail.style.visibility = 'visible'; 
      tail.style.transform = 'translateX(-100vw)'; 
      setTimeout(() => {
        tail.style.transform = 'translateX(-100vw) rotate(-25deg) translateY(-20px)';
      }, 1500);
      
      setTimeout(() => {
        tail.style.transform = 'translateX(-150vw)';
      }, 4000);
    } else if (phase === 'Default') {
      tail.style.visibility = 'hidden';
      tail.style.transform = 'translateX(0) rotate(0) translateY(0)'; 
    }
  }, [phase]);

  return <img className="rabbit-tail absolute" src={RabbitTailImage} alt="Rabbit Tail" />;
}

export default RabbitTail;
