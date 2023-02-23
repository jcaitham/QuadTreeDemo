import * as ReactDOMClient from 'react-dom/client';
import React from "react";
import { Coordinates, QuadTree } from "./quadTree/quadTree.js";
import { Scoreboard } from "./Scoreboard.js";
import "../styles/index.scss";


interface TreeContents extends Coordinates
{
	el: HTMLDivElement;
}

export class QuadTreeControl
{

	/** Backing quadTree data model */
	private quadTree: QuadTree<TreeContents>;

	/** Width of the web page */
	private width: number;
	/** Height of the web page */
	private height: number;

	private boundaryOverlay: SVGElement;
	private background: HTMLDivElement;
	private userOverlay: SVGElement;
	private scoreboardWrapper: HTMLDivElement;

	/** how big each square should be */
	private squareSize = 10;

	private totalNumPoints = 0;
	private radius: number;

	private blueHighlightedPoints: HTMLDivElement[];
	private greenHighlightedPoints: HTMLDivElement[];

	private scores: { red: number, blue?: number, green?: number; };

	private preventMouseEvent = false;

	private scoreboardRoot: ReactDOMClient.Root | null = null;

	private handlers: { [event: string]: EventListener; };

	public constructor(element: HTMLElement)
	{
		element.classList.add("quadTree");

		this.boundaryOverlay = document.createElementNS("http://www.w3.org/2000/svg", "svg") as Element as SVGElement;
		this.boundaryOverlay.classList.add("boundaryOverlay");
		this.boundaryOverlay.id = "boundaryOverlay";
		element.appendChild(this.boundaryOverlay);


		this.background = document.createElement("div");
		this.background.classList.add("background");
		element.appendChild(this.background);


		this.userOverlay = document.createElementNS("http://www.w3.org/2000/svg", "svg") as Element as SVGElement;
		this.userOverlay.classList.add("boundaryOverlay");
		element.appendChild(this.userOverlay);

		this.scoreboardWrapper = document.createElement("div");
		element.appendChild(this.scoreboardWrapper);

		this.scores = { red: 0 };

		this.drawScoreboard();

		// initialize properties
		this.height = this.background.clientHeight;
		this.width = this.background.clientWidth;
		this.quadTree = new QuadTree(this.width, this.height, 4);
		this.radius = this.width / 15;
		this.greenHighlightedPoints = [];
		this.blueHighlightedPoints = [];

		this.handlers = {};
		this.handlers["mousedown"] = this.onClick.bind(this) as EventListener;
		this.handlers["mousemove"] = this.onMouseMove.bind(this) as EventListener;
		this.handlers["contextmenu"] = this.stopEvent.bind(this) as EventListener;


		// attach action handlers
		for (const event in this.handlers)
		{
			this.background.addEventListener(event, this.handlers[event]);
		}

		element.appendChild(this.buildControlPanel());

		this.drawBoundaries(this.quadTree.getNewBoundaries());
	}

	public destroy(): void
	{
		for (const event in this.handlers)
		{
			this.background.removeEventListener(event, this.handlers[event]);
		}
	}

	/** Redraw the scoreboard part of the screen */
	private drawScoreboard(): void
	{
		if (this.scoreboardRoot === null)
		{
			this.scoreboardRoot = ReactDOMClient.createRoot(this.scoreboardWrapper);
		}
		this.scoreboardRoot.render(<Scoreboard red={this.scores.red} blue={this.scores.blue} green={this.scores.green} />);
	}

	private buildControlPanel(): HTMLDivElement
	{
		const wrapper = document.createElement("div");
		wrapper.classList.add("controlPanel");

		const label = document.createElement("label");
		label.innerText = "Search Radius";

		const input = document.createElement("input");
		input.type = "range";
		input.min = "1";
		input.max = "1000";
		input.style.verticalAlign = "middle";

		label.appendChild(input);

		const button = document.createElement("button");
		button.innerText = "Reset";

		wrapper.appendChild(label);
		wrapper.appendChild(button);

		input.addEventListener("input", this.onChangeSearchRadius.bind(this));
		button.addEventListener("click", this.onResetClick.bind(this));
		input.defaultValue = String(this.radius);

		return wrapper;
	}

	/** Handler for clicking on the grid */
	private onClick(event: MouseEvent): void
	{
		this.clearHighlights();

		const x = event.clientX - (event.currentTarget as HTMLDivElement).getBoundingClientRect().left;
		const y = event.clientY - (event.currentTarget as HTMLDivElement).getBoundingClientRect().top;

		// right-click means we want to show the green search radius circle
		if (event.button === 2)
		{
			this.findNearbyPoints(x, y, this.radius);
		}
		else if (event.buttons === 1 && !this.preventMouseEvent)  // left-click = place new point
		{
			this.placeNewPoint(x, y);
		}
		this.stopEvent(event);
	}

	/** Handles mouse move over the main canvas.  If the mouse is being held down, then this will repeatedly place new data points on the board */
	private onMouseMove(event: MouseEvent): void
	{
		if (event.buttons === 1 && !this.preventMouseEvent)
		{
			const x = event.clientX - (event.currentTarget as HTMLDivElement).getBoundingClientRect().left;
			const y = event.clientY - (event.currentTarget as HTMLDivElement).getBoundingClientRect().top;

			this.placeNewPoint(x, y);
			this.preventMouseEvent = true;
			setTimeout(() => { this.preventMouseEvent = false; }, 20);
		}
	}

	/** Event handler for moving the search radius slider */
	private onChangeSearchRadius(event: Event): void
	{
		this.radius = Number((event.currentTarget as HTMLInputElement).value);
	}

	/** Event handler for clicking the "reset" button.  Clears most of the elements and resets the app state */
	private onResetClick(_event: Event): void
	{
		this.quadTree = new QuadTree(this.width, this.height, 4);

		this.boundaryOverlay.innerHTML = "";
		this.background.innerHTML = "";
		this.userOverlay.innerHTML = "";

		this.greenHighlightedPoints = [];
		this.blueHighlightedPoints = [];

		this.totalNumPoints = 0;

		this.drawScoreboard();
	}

	/** Stops a mouse event */
	private stopEvent(event: MouseEvent): void
	{
		event.preventDefault();
		event.stopPropagation();
	}

	/** Given an x/y coordinate pair and a radius, use the quad tree to find all of the points within that radius */
	private findNearbyPoints(x: number, y: number, radius: number): void
	{
		const point: Coordinates = { x: x, y: y };
		const topLeft: Coordinates = { x: point.x - radius, y: point.y - radius };
		const bottomRight: Coordinates = { x: point.x + radius, y: point.y + radius };

		// QuadTree finds all points that are from nodes that at least partially overlap with the search area
		const pointList = this.quadTree.getDataFromOverlappingPoints(topLeft, bottomRight);
		//this.scoreboardDivs.found.innerHTML = String(pointList.length);
		this.scores.blue = pointList.length;

		const greenCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
		greenCircle.setAttribute("cx", String(x));
		greenCircle.setAttribute("cy", String(y));
		greenCircle.setAttribute("r", String(radius));
		greenCircle.classList.add("greenCircle");
		this.userOverlay.appendChild(greenCircle);


		// For all of the points from the nearby nodes, we need to actually measure the distance to the point, since it may actually be 
		// outside of the circular search area
		for (const p of pointList)
		{
			// points that are within the search radius will become green
			if (this.getDistance(point, p) <= radius)
			{
				this.greenHighlightedPoints.push(p.el);
			}
			else
			{
				this.blueHighlightedPoints.push(p.el);
			}
		}

		this.highlightPoints(this.greenHighlightedPoints, "green");
		this.highlightPoints(this.blueHighlightedPoints, "blue");
		this.scores.green = this.greenHighlightedPoints.length;
		this.drawScoreboard();

	}

	/** Given a list of points, apply the provided CSS class to all of them */
	private highlightPoints(elements: HTMLDivElement[], cssClass: string): void
	{
		for (const el of elements)
		{
			el.classList.add(cssClass);
		}
	}

	/** Clear all highlights from the board */
	private clearHighlights(): void
	{
		this.userOverlay.innerHTML = "";

		for (const el of this.greenHighlightedPoints)
		{
			el.classList.remove("green");
		}
		for (const el of this.blueHighlightedPoints)
		{
			el.classList.remove("blue");
		}

		this.greenHighlightedPoints = [];
		this.blueHighlightedPoints = [];

		this.scores.blue = undefined;
		this.scores.green = undefined;
		this.drawScoreboard();
	}

	/** Returns the distance between two points */
	private getDistance(a: Coordinates, b: Coordinates): number
	{
		return Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
	}

	/** Place a new point on the board */
	private placeNewPoint(x: number, y: number): void
	{
		if (this.quadTree.containsData({ x: x, y: y }))
		{
			return;
		}
		this.totalNumPoints++;
		this.scores.red = this.totalNumPoints;
		this.drawScoreboard();

		// construct a new red rectangle
		const newSquare = this.drawSquare(x, y);
		this.background.appendChild(newSquare);

		// add the point to the quad tree
		this.quadTree.addPoint({ el: newSquare, x: x, y: y });

		// add in any new boundaries that the quad tree may have created (in the event of a rebalance)
		this.drawBoundaries(this.quadTree.getNewBoundaries());

		this.drawScoreboard();
	}

	/** Creates a square div and centers it at the provided coordinates */
	private drawSquare(x: number, y: number): HTMLDivElement
	{
		const newSquare = document.createElement("div");
		newSquare.classList.add("overlaySquare");

		newSquare.style.top = (y - this.squareSize / 2) + "px";
		newSquare.style.left = (x - this.squareSize / 2) + "px";
		newSquare.style.width = this.squareSize + "px";
		newSquare.style.height = this.squareSize + "px";

		return newSquare;
	}


	/** Draws boundary lines */
	private drawBoundaries(boundaryList: { topLeft: Coordinates, bottomRight: Coordinates; }[]): void
	{
		for (const boundary of boundaryList)
		{
			this.drawBoundary(boundary);
		}
	}

	/** Draw a rectangle bounding the provided coordinates */
	private drawBoundary(boundary: { topLeft: Coordinates, bottomRight: Coordinates; })
	{
		const x = Math.max(boundary.topLeft.x, 1);
		const y = Math.max(boundary.topLeft.y, 1);
		const width = Math.min(this.width - 2, boundary.bottomRight.x - boundary.topLeft.x);
		const height = Math.min(this.height - 2, boundary.bottomRight.y - boundary.topLeft.y);
		const newRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
		newRect.setAttribute("x", String(x));
		newRect.setAttribute("y", String(y));
		newRect.setAttribute("width", String(width));
		newRect.setAttribute("height", String(height));
		newRect.setAttribute("class", "boundaryRectangle");

		this.boundaryOverlay.appendChild(newRect);
	}
}
