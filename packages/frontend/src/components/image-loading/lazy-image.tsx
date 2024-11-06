import { useState, useEffect } from "react";
import ImageLoadingPlaceholder from "./placeholder";

export default function LazyImage({ src, width }: { src: string, width?: string | number }) {
    const [loading, setLoading] = useState(true);
    const [minHeight, setMinHeight] = useState("228px"); // Default for smaller screens

    useEffect(() => {
        // Function to update minHeight based on screen width
        const updateMinHeight = () => {
            const screenWidth = window.innerWidth;
            if (screenWidth <= 320) {
                setMinHeight("228px");
            } else if (screenWidth <= 375) {
                setMinHeight("250px");
            } else if (screenWidth <= 414) {
                setMinHeight("300px");
            } else {
                setMinHeight("340px");
            }
        };

        updateMinHeight();
        window.addEventListener("resize", updateMinHeight);

        return () => window.removeEventListener("resize", updateMinHeight);
    }, []);

    return (
        <div style={{
            width: width ? width : "100%",
            height: "100%",
            minHeight: minHeight,
            minWidth: minHeight,
        }}>
            <img
                src={src}
                style={{ display: loading ? "none" : "block", width: "100%", animation: "fadeIn 0.5s" }}
                onLoad={() => setLoading(false)}
            />

            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: loading ? "block" : "none",
                }}
            >
                <ImageLoadingPlaceholder height={minHeight}/>
            </div>
        </div>
    );
}
