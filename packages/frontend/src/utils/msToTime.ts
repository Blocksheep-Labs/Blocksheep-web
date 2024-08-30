export default function msToTime(duration: number) {
    const
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor(duration / (1000 * 60 * 60)); // Remove the modulo operation here
  
    const hoursS = (hours < 10) ? "0" + hours : hours;
    const minutesS = (minutes < 10) ? "0" + minutes : minutes;
    const secondsS = (seconds < 10) ? "0" + seconds : seconds;
  
    return hoursS + ":" + minutesS + ":" + secondsS;
  }