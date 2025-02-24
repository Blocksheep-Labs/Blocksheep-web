import { useRef } from "react";
import "./reordable-list.css";
import defaultScreenTimings from "@/config/default_screen_timings.json";

export default function ReordableList(props) {
    const { items, setItems, toggledItems, setToggledItems, timingsMap, setTimingsMap } = props;

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

            // Reorder timingsMap as well
            setTimingsMap(prev => {
                const newMap = new Map(prev);
                const draggedTime = newMap.get(draggedItem);
                newMap.delete(draggedItem);

                const reorderedMap = new Map();
                reorderedItems.forEach((item) => {
                    reorderedMap.set(item, newMap.has(item) ? newMap.get(item) : draggedTime);
                });

                return reorderedMap;
            });

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

        // Sync timingsMap with new order
        setTimingsMap(prev => {
            const newMap = new Map(prev);
            const movedTime = newMap.get(movedItem);
            newMap.delete(movedItem);

            const reorderedMap = new Map();
            updatedItems.forEach((item) => {
                reorderedMap.set(item, newMap.has(item) ? newMap.get(item) : movedTime);
            });

            return reorderedMap;
        });

        setItems(updatedItems);
    };

    const toggleItem = (screenName) => {
        let updatedToggles = [...toggledItems];

        if (updatedToggles.includes(screenName)) {
            updatedToggles = updatedToggles.filter(i => i !== screenName);
        } else {
            updatedToggles.push(screenName);
        }

        setToggledItems(updatedToggles);
    };

    const handleScreenTimeChange = (seconds, screen) => {
        setTimingsMap(prev => {
            const newMap = new Map(prev);
            newMap.set(screen, Number(seconds));
            return newMap;
        });
    };

    return (
        <ul className="sortable-list">
            {items.map((item, index) => (
                <li
                    key={index}
                    className={`item ${!toggledItems.includes(item) ? "toggled" : ""}`}
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={(e) => handleTouchStart(index, e)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="cont">
                        <label className="pr-2">
                            <input 
                                type="checkbox" 
                                checked={toggledItems.includes(item)} 
                                onChange={() => toggleItem(item)} 
                            />
                            <span className="slider"></span>
                        </label>
                        <span>{item}</span>
                    </div>

                    <div className="buttons">
                        <button type="button" onClick={() => moveItem(index, -1)}>UP</button>
                        <button type="button" onClick={() => moveItem(index, 1)}>DOWN</button>
                    </div>

                    <div className="duration-input-box">
                        <div>Duration:</div>
                        <input 
                            className="number" 
                            type="number" 
                            value={timingsMap.get(item)}
                            disabled={!defaultScreenTimings[item]?.editable}
                            onChange={e => handleScreenTimeChange(e.target.value, item)}
                        />
                        <div>sec.</div>
                    </div>
                </li>
            ))}
        </ul>
    );
}
