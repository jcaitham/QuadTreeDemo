import React, { useEffect, useRef } from "react";
import { QuadTreeControl } from "./scripts/QuadTreeControl.js";
export const QuadTreeDemo = () => {
    const containerRef = useRef(null);
    const quadTreeRef = useRef(null);
    const reset = () => {
        if (quadTreeRef.current) {
            quadTreeRef.current.destroy();
        }
        if (containerRef.current) {
            containerRef.current.innerHTML = "";
            quadTreeRef.current = new QuadTreeControl(containerRef.current);
        }
    };
    useEffect(() => {
        reset();
        if (containerRef.current) {
            const ro = new ResizeObserver(reset);
            ro.observe(containerRef.current);
        }
    }, []);
    return (React.createElement("div", { ref: containerRef }));
};
