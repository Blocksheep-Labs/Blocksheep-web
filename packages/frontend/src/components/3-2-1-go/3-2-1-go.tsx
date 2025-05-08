import { useState, useEffect } from 'react';
import "./3-2-1-go.css";

const Countdown321 = () => {
  const [message, setMessage] = useState('5');

  useEffect(() => {
    startCountdown();
  }, []);

  const startCountdown = () => {
    let countdownValue = 5;

    const interval = setInterval(() => {
      if (countdownValue > 1) {
        countdownValue--;
        setMessage(countdownValue.toString());
      } else if (countdownValue === 1) {
        setMessage('Go!');
      } else {
        countdownValue--;
        clearInterval(interval);
      }
    }, 1000);
  };

  return (
    <div style={styles.container}>
      <div
        className={`countdown-text ${message === 'Go!' ? 'go-style' : 'count-style'}`}
        key={Number(message) <= 3 ? message : "text-key"}
      >
        {
          (() => {
            if (Number(message) > 3) {
              return (
                <div className="intro-container">
                  <div className="intro-line">WIN THE MINI GAMES</div>
                  <div className="intro-line">TO ADVANCE THE RACE</div>
                </div>
              );
            } else {
              return (
                <>{message}</>
              );
            }
          })()
        }
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
