import { useRef } from "react";
import "./reordable-list.css";

export default function ReordableList(props) {
    const { items, setItems } = props;

    const draggingItemRef = useRef(null);
    const dragOverItemRef = useRef(null);

    const handleDragStart = (index) => {
        draggingItemRef.current = index;
    };

    const handleDragEnter = (index) => {
        dragOverItemRef.current = index;

        // Perform a reorder operation only if the indices differ
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

    return (
        <ul className="sortable-list">
            {items.map((item, index) => (
                <li
                    key={index}
                    className="item"
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragEnter={() => handleDragEnter(index)}
                    onDragEnd={handleDragEnd}
                    onTouchStart={(e) => handleTouchStart(index, e)}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="cont">
                        <span>{item}</span>
                        <div className="buttons">
                            <button onClick={() => moveItem(index, -1)}>Up</button>
                            <button onClick={() => moveItem(index, 1)}>Down</button>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    );
}