import React from "react";

class TopPageTimer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      duration: props.duration,
      progress: 0,
    };
  }

  componentDidMount() {
    this.startTimer();
  }

  componentWillUnmount() {
    clearInterval(this.interval); // Clear interval when the component unmounts
  }

  componentDidUpdate(prevProps) {
    if (prevProps.duration !== this.props.duration) {
      // Clear the current timer if the duration prop changes
      clearInterval(this.interval);
      this.setState({ progress: 0 }, this.startTimer); // Reset progress and start a new timer
    }
  }

  startTimer = () => {
    const { duration } = this.props; // Duration in milliseconds
    const intervalTime = 10; // Interval time in milliseconds
    const totalSteps = duration / intervalTime; // Total steps to reach 100%
    
    let stepCount = 0;

    this.interval = setInterval(() => {
      stepCount++;
      const newProgress = (stepCount / totalSteps) * 100;

      if (newProgress >= 100) {
        clearInterval(this.interval);
        this.setState({ progress: 100 });
      } else {
        this.setState({ progress: newProgress });
      }
    }, intervalTime);
  };

  render() {
    const { progress } = this.state;
    return (
      <div className="absolute top-3 flex items-center justify-center w-full h-10">
        <div className="w-[90%] h-[2px] bg-[#555] border-r-[1px] overflow-hidden z-50">
          <div
            className="h-full bg-white"
            style={{
              transition: 'width 0.01s linear',
              width: `${progress}%`,
            }}
          ></div>
        </div>
      </div>
    );
  }
}

export default TopPageTimer;
