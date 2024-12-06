// @ts-nocheck

import RabbitHeadImage from "../../assets/rabbit-hole/rabbit.png"
import React from "react";

function RabbitHead({ phase }) {
  React.useEffect(() => {
    const head = document.querySelector('.rabbit-head');
    if (phase === 'CloseTunnel') {
     
      head.style.transform = 'translateX(-130vw)'; 
    } else if (phase === 'OpenTunnel') { // it goes back in position
       head.style.visibility = 'hidden';
      head.style.transform = 'translateX(50vw)';

    } else if (phase === 'Default') {
        head.style.visibility = 'visible';
      head.style.transform = 'translateX(0)'; 
    }
  }, [phase]);

  return <img className="rabbit-head" src={RabbitHeadImage} alt="Rabbit Head" />;
}

export default RabbitHead;
