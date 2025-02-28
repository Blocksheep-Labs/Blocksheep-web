import React, { useState } from "react";
import "../../../assets/css/index.css";
import BasketCarrotImage from "../../../assets/images/carrot-basket.png";


export function CarrotBasket({fuelLeft}: {fuelLeft: number}) {
    return (
        <div className="relative">
            <img src={BasketCarrotImage} alt="basket" className="w-28"/>
            <span className="text-white absolute left-[57px] -bottom-[2px] text-3xl" style={{ transform: 'translate(-50%,-50%)' }}>{fuelLeft}</span>
        </div>
    );
}


export const CarrotBasketIncrement = ({
    MAX_CARROTS,
    displayNumber,
    setDisplayNumber,
    disabled,
}: {
    setDisplayNumber: (a: number) => void;
    displayNumber: number;
    MAX_CARROTS: number;
    disabled: boolean;
}) => {
    const throwCarrot = () => {
        if (displayNumber >= MAX_CARROTS || disabled) return;

        const gameContainer = document.getElementById("game-container");
        const carrot = document.createElement("div");
        carrot.classList.add("carrot");
        carrot.style.position = "absolute";
        carrot.style.width = "20px";
        carrot.style.height = "50px";
        carrot.style.background = "orange";
        carrot.style.borderRadius = "10px";
        carrot.style.left = `${Math.random() * window.innerWidth}px`;
        carrot.style.top = "0px";
        carrot.style.transition = "top 1s ease-out";

        gameContainer?.appendChild(carrot);

        console.log({ carrot })

        setTimeout(() => {
            carrot.style.top = "80vh";
        }, 50);

        setTimeout(() => carrot.remove(), 3000);

        handleIncrease();
    };

    const handleIncrease = () => {
        if (displayNumber >= MAX_CARROTS || disabled) return;
        const newValue = Math.min(MAX_CARROTS, displayNumber + 1);
        setDisplayNumber(newValue);
    };

    return (
        <div id="game-container">
            <button id="throw-button" 
                onClick={throwCarrot} 
                style={{ opacity: (displayNumber >= MAX_CARROTS || disabled) ? "0.6" : "1" }}
            >
                <span className="pl-3">DROP</span>
            </button>
            <div id="counter">{displayNumber}</div>
        </div>
    );
};
