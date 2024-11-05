import { useState } from "react";
import ImageLoadingPlaceholder from "./placeholder";

export default function LazyImage({src, width}: {src: string, width?: string | number}) {
    const [loading, setLoading] = useState(true);

    return (
        <div style={{

            width: width ? width : "100%",
            height: "100%",
            minHeight: '228px'
        }}>
            <img 
                src={src} 
                style={{ display: loading?"none":"block", width:"100%", animation: "fadeIn 0.5s" }} 
                onLoad={() => setLoading(false)}
            >
            </img>

            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: loading ? "block": "none",
                }}
            >
                <ImageLoadingPlaceholder/>
            </div>
        </div>
    );
}