import React from "react";
import "../../assets/css/index.css";

/************************************************
   * 2) FRAME EDGES (React)
   ************************************************/
export default class FrameEdges extends React.Component {
    constructor(props) {
      super(props);
      
      this.phrase = "ARE YOU SMARTER THAN THE AVERAGE";
      this.words = this.phrase.split(" ");
      // Edge order re-arranged so top is index=1 => 
      //   that makes "AVERAGE" eventually land on top.
      this.edges = ["left", "top", "right", "bottom"];
  
      this.state = {
        showFrame: false,
        currentWordIndex: 0,
        textByEdge: {
          left: "",
          top: "",
          right: "",
          bottom: "",
        },
      };
      
      this.mainInterval = null;
      this.resetInterval = null;
      this.appearTimeout = null;
    }
  
    componentDidMount() {
      // Appear after 7.5s
      this.appearTimeout = setTimeout(() => {
        this.setState({ showFrame: true }, () => {
          this.startNewCycle();
        });
      }, 9500);
  
      // Reset every 7s
      this.resetInterval = setInterval(() => {
        if (this.state.showFrame) {
          this.startNewCycle();
        }
      }, 7000);
    }
  
    componentWillUnmount() {
      clearTimeout(this.appearTimeout);
      clearInterval(this.resetInterval);
      clearInterval(this.mainInterval);
    }
  
    startNewCycle() {
      clearInterval(this.mainInterval);
  
      // Fill text for each edge
      const newTextByEdge = {
        left: this.makeEdgeText("left"),
        top: this.makeEdgeText("top"),
        right: this.makeEdgeText("right"),
        bottom: this.makeEdgeText("bottom"),
      };
  
      this.setState(
        {
          currentWordIndex: 0,
          textByEdge: newTextByEdge,
        },
        () => {
          // highlight immediately
          this.highlightNextWord();
          // Then highlight every 250 ms
          this.mainInterval = setInterval(() => {
            this.highlightNextWord();
          }, 200);
        }
      );
    }
  
    // Returns repeated text for an edge
    makeEdgeText(edge) {
      const repeats = edge === "left" || edge === "right" ? 5 : 2;
      return (this.phrase + " ").repeat(repeats).trim();
    }
  
    highlightNextWord() {
      this.setState((prev) => {
        const i = prev.currentWordIndex;
        const currentEdge = this.edges[i % this.edges.length];
        const wordToHighlight = this.words[i % this.words.length];
  
        let rawText = prev.textByEdge[currentEdge] || "";
  
        // Strip out old highlight
        rawText = rawText.replace(/<\/?span[^>]*>/g, "");
  
        const arr = rawText.split(" ");
        const idx = arr.indexOf(wordToHighlight);
        if (idx >= 0) {
          arr[idx] = `<span class="highlight">${arr[idx]}</span>`;
        }
        const updated = arr.join(" ");
  
        const newTextByEdge = {
          ...prev.textByEdge,
          [currentEdge]: updated,
        };
  
        // Next index
        const nextWordIndex = (i + 1) % (this.words.length * this.edges.length);
  
        return {
          currentWordIndex: nextWordIndex,
          textByEdge: newTextByEdge,
        };
      });
    }
  
    renderEdge(edge) {
      return (
        <div
          className={`edge ${edge}`}
          dangerouslySetInnerHTML={{ __html: this.state.textByEdge[edge] }}
        />
      );
    }
  
    render() {
      return (
        <div className={`frame-container ${this.state.showFrame ? "show" : ""}`}>
          {this.renderEdge("left")}
          {this.renderEdge("top")}
          {this.renderEdge("right")}
          {this.renderEdge("bottom")}
        </div>
      );
    }
  }