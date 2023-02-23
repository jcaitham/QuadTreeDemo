import React, { useEffect, useRef } from "react";
import { QuadTreeControl } from "./scripts/QuadTreeControl.js";


export const QuadTreeDemo = () =>
{
	const containerRef = useRef<HTMLDivElement>(null);
	const quadTreeRef = useRef<QuadTreeControl | null>(null);

	const reset = () =>
	{
		if (quadTreeRef.current)
		{
			quadTreeRef.current.destroy();
		}
		if (containerRef.current)
		{
			containerRef.current.innerHTML = "";
			quadTreeRef.current = new QuadTreeControl(containerRef.current);
		}
	};

	useEffect(() =>
	{
		reset();
		if (containerRef.current)
		{
			const ro: ResizeObserver = new ResizeObserver(reset);
			ro.observe(containerRef.current);
		}
	}, []);

	return (
		<div ref={containerRef}>

		</div>
	);
};


