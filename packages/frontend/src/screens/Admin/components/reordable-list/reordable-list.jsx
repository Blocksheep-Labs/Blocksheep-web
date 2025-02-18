import { useRef, useState } from "react";
import "./reordable-list.css";

export default function ReordableList(props) {
    const { items, setItems, toggledItems, setToggledItems } = props;

    const draggingItemRef = useRef(null);
    const dragOverItemRef = useRef(null);

    const handleDragStart = (index) => {
        draggingItemRef.current = index;
    };

    const handleDragEnter = (index) => {
        dragOverItemRef.current = index;

        if (draggingItemRef.current !== index) {
            const reorderedItems = [...items];
            const [draggedItem] = reorderedItems.splice(draggingItemRef.current, 1);
            reorderedItems.splice(index, 0, draggedItem);

            setItems(reorderedItems);
            draggingItemRef.current = index;
        }
    };

    const handleDragEnd = () => {
        draggingItemRef.current = null;
        dragOverItemRef.current = null;
    };

    const handleTouchStart = (index, e) => {
        draggingItemRef.current = index;
        e.target.classList.add("dragging");
    };

    const handleTouchMove = (e) => {
        const touchLocation = e.touches[0];
        const element = document.elementFromPoint(touchLocation.clientX, touchLocation.clientY);

        if (element && element.closest(".item")) {
            const index = Array.from(element.closest(".sortable-list").children).indexOf(element.closest(".item"));
            handleDragEnter(index);
        }
    };

    const handleTouchEnd = (e) => {
        e.target.classList.remove("dragging");
        handleDragEnd();
    };

    const moveItem = (index, direction) => {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= items.length) return;

        const updatedItems = [...items];
        const [movedItem] = updatedItems.splice(index, 1);
        updatedItems.splice(newIndex, 0, movedItem);

        setItems(updatedItems);
    };

    const toggleItem = (screenName) => {
        let updatedToggles = [...toggledItems];

        if (updatedToggles.includes(screenName)) {
            updatedToggles = updatedToggles.filter(i => i != screenName)
        } else {
            updatedToggles.push(screenName);
        }
        
        setToggledItems(updatedToggles);
    };

    return (
        <ul className="sortable-list">
            {items.map((item, index) => (
                <li
                    key={index}
                    className={`item ${!toggledItems.includes(item) ? "toggled" : ""}`}
                    // draggable={!!toggledItems.includes(item)}
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={(e) => handleTouchStart(index, e)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="cont">
                        <label className="switch">
                            <input 
                                type="checkbox" 
                                checked={toggledItems.includes(item)} 
                                onChange={() => toggleItem(items[index])} 
                            />
                            <span className="slider"></span>
                        </label>
                        <span>{item}</span>
                        <div className="buttons">
                            <button onClick={() => moveItem(index, -1)}>UP</button>
                            <button onClick={() => moveItem(index, 1)}>DOWN</button>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}