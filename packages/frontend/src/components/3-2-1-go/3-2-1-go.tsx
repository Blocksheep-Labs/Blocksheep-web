import React, { useState, useEffect } from 'react';
import "./3-2-1-go.css";

const Countdown321 = () => {
  const [count, setCount] = useState(3);
  const [message, setMessage] = useState('3');

  useEffect(() => {
    startCountdown();
  }, []);

  const startCountdown = () => {
    let countdownValue = count;

    const interval = setInterval(() => {
      if (countdownValue > 1) {
        countdownValue--;
        setMessage(countdownValue.toString());
      } else if (countdownValue === 1) {
        setMessage('Go!');
        countdownValue--;
      } else {
        clearInterval(interval);
      }
    }, 1000);
  };

  return (
    <div style={styles.container}>
      <div
        className={`countdown-text ${message === 'Go!' ? 'go-style' : 'count-style'}`}
        key={message}
      >
        {message}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    overflow: 'hidden',
  },
};

export default Countdown321;
