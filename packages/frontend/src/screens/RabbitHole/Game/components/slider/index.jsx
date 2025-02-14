import React from "react";
import "../../../assets/css/index.css";

const CarrotSlider = class extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
        value: 0,// Math.floor((props.min + props.max) / 2),
      };
      this.sliderRef = React.createRef();
    }
  
    handleKnobMove = (event) => {
        if (this.props.isRolling) return;

        const slider = this.sliderRef.current.querySelector(".slider-track");
        const rect = slider.getBoundingClientRect();
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        let newValue = Math.round(
            ((clientX - rect.left) / rect.width) * (this.props.max - this.props.min)
        );
        newValue = Math.max(this.props.min, Math.min(this.props.max, newValue));
        this.setState({ value: newValue });
        this.props.setDisplayNumber(newValue);
    };
  
    startDrag = (event) => {
      event.preventDefault();
      document.addEventListener("mousemove", this.handleKnobMove);
      document.addEventListener("touchmove", this.handleKnobMove);
      document.addEventListener("mouseup", this.stopDrag);
      document.addEventListener("touchend", this.stopDrag);
    };
  
    stopDrag = () => {
      document.removeEventListener("mousemove", this.handleKnobMove);
      document.removeEventListener("touchmove", this.handleKnobMove);
      document.removeEventListener("mouseup", this.stopDrag);
      document.removeEventListener("touchend", this.stopDrag);
    };
  
    handleIncrement = () => {
      this.setState((prevState) => {
        const newValue = Math.min(this.props.max, prevState.value + 1);
        this.props.setDisplayNumber(newValue);
        return { value: newValue };
      });
    };
  
    handleDecrement = () => {
      this.setState((prevState) => {
        const newValue = Math.max(this.props.min, prevState.value - 1);
        this.props.setDisplayNumber(newValue);
        return { value: newValue };
      });
    };
  
    componentDidUpdate(prevProps) {
      if (prevProps.isRolling && !this.props.isRolling) {
        this.setState({ value: 0 });
      }
    }
  
    render() {
      const { value } = this.state;
      const knobPosition = `${((value - this.props.min) / (this.props.max - this.props.min)) * 100}%`;
      
      return (
        <div className="slider-container" ref={this.sliderRef}>
          <div className="number-display-rh" style={{ padding: 0 }}>{value}</div>

          <div className="slider-bar" style={{ opacity: !this.props.isRolling ? 1 : 0.5 }}>
            <div className="slider-track">
              <div
                className="knob"
                style={{ left: knobPosition }}
                // style={{ left: knobPosition, cursor: "url('../../assets/images/cursor-swipe.png'), auto" }}

                onMouseDown={!this.props.isRolling ? this.startDrag : undefined}
                onTouchStart={!this.props.isRolling ? this.startDrag : undefined}
                
              />
            </div>
            <button 
              className="carrot-btn minus-btn" 
              onClick={!this.props.isRolling ? this.handleDecrement : undefined} 
              disabled={this.props.isRolling}
            />
            <button 
              className="carrot-btn plus-btn" 
              onClick={!this.props.isRolling ? this.handleIncrement : undefined} 
              disabled={this.props.isRolling}
            />
          </div>
        </div>
      );
    }
  };


export default CarrotSlider;
