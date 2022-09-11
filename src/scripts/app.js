import { QuadTree } from "./quadTree/quadTree.js";
export class QuadTreeDemo {
    constructor() {
        var _a, _b;
        /** how big each square should be */
        this.squareSize = 10;
        this.totalNumPoints = 0;
        this.preventMouseEvent = false;
        // initialize properties
        this.height = document.body.clientHeight;
        this.width = document.body.clientWidth;
        this.quadTree = new QuadTree(this.width, this.height, 4);
        this.radius = this.width / 10;
        this.greenHighlightedPoints = [];
        this.blueHighlightedPoints = [];
        // retrieve divs for later
        this.boundaryOverlay = document.getElementById("boundaryOverlay");
        this.background = document.getElementById("background");
        this.userOverlay = document.getElementById("userOverlay");
        this.scoreboardDivs = {
            total: document.getElementById("totalPointsCounter"),
            found: document.getElementById("foundPointsCounter"),
            highlighted: document.getElementById("highlightedPointsCounter")
        };
        // attach action handlers
        this.background.addEventListener("mousedown", this.onClick.bind(this));
        this.background.addEventListener("mousemove", this.onMouseMove.bind(this));
        this.background.addEventListener("contextmenu", this.stopEvent.bind(this));
        (_a = document.getElementById("circleSizeInput")) === null || _a === void 0 ? void 0 : _a.addEventListener("input", this.onChangeSearchRadius.bind(this));
        (_b = document.getElementById("resetButton")) === null || _b === void 0 ? void 0 : _b.addEventListener("click", this.onResetClick.bind(this));
        document.getElementById("circleSizeInput").defaultValue = String(this.radius);
    }
    /** Handler for clicking on the grid */
    onClick(event) {
        this.clearHighlights();
        const x = event.clientX;
        const y = event.clientY;
        // right-click means we want to show the green search radius circle
        if (event.button === 2) {
            this.findNearbyPoints(x, y, this.radius);
        }
        else if (event.buttons === 1 && !this.preventMouseEvent) // left-click = place new point
         {
            this.placeNewPoint(x, y);
        }
        this.stopEvent(event);
    }
    /** Handles mouse move over the main canvas.  If the mouse is being held down, then this will repeatedly place new data points on the board */
    onMouseMove(event) {
        if (event.buttons === 1 && !this.preventMouseEvent) {
            const x = event.clientX;
            const y = event.clientY;
            this.placeNewPoint(x, y);
            this.preventMouseEvent = true;
            setTimeout(() => { this.preventMouseEvent = false; }, 20);
        }
    }
    /** Event handler for moving the search radius slider */
    onChangeSearchRadius(event) {
        this.radius = Number(event.currentTarget.value);
    }
    /** Event handler for clicking the "reset" button.  Clears most of the elements and resets the app state */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    onResetClick(_event) {
        this.quadTree = new QuadTree(this.width, this.height, 4);
        this.boundaryOverlay.innerHTML = "";
        this.background.innerHTML = "";
        this.userOverlay.innerHTML = "";
        this.greenHighlightedPoints = [];
        this.blueHighlightedPoints = [];
        this.totalNumPoints = 0;
        this.scoreboardDivs.total.innerHTML = "0";
        this.scoreboardDivs.found.innerHTML = "";
        this.scoreboardDivs.highlighted.innerHTML = "";
    }
    /** Stops a mouse event */
    stopEvent(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    /** Given an x/y coordinate pair and a radius, use the quad tree to find all of the points within that radius */
    findNearbyPoints(x, y, radius) {
        const point = { x: x, y: y };
        const topLeft = { x: point.x - radius, y: point.y - radius };
        const bottomRight = { x: point.x + radius, y: point.y + radius };
        // QuadTree finds all points that are from nodes that at least partially overlap with the search area
        const pointList = this.quadTree.getDataFromOverlappingPoints(topLeft, bottomRight);
        this.scoreboardDivs.found.innerHTML = String(pointList.length);
        const greenCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        greenCircle.setAttribute("cx", String(x));
        greenCircle.setAttribute("cy", String(y));
        greenCircle.setAttribute("r", String(radius));
        greenCircle.classList.add("greenCircle");
        this.userOverlay.appendChild(greenCircle);
        // For all of the points from the nearby nodes, we need to actually measure the distance to the point, since it may actually be 
        // outside of the circular search area
        for (const p of pointList) {
            // points that are within the search radius will become green
            if (this.getDistance(point, p) <= radius) {
                this.greenHighlightedPoints.push(p.el);
            }
            else {
                this.blueHighlightedPoints.push(p.el);
            }
        }
        this.highlightPoints(this.greenHighlightedPoints, "green");
        this.highlightPoints(this.blueHighlightedPoints, "blue");
        this.scoreboardDivs.highlighted.innerHTML = String(this.greenHighlightedPoints.length);
    }
    /** Given a list of points, apply the provided CSS class to all of them */
    highlightPoints(elements, cssClass) {
        for (const el of elements) {
            el.classList.add(cssClass);
        }
    }
    /** Clear all highlights from the board */
    clearHighlights() {
        this.userOverlay.innerHTML = "";
        for (const el of this.greenHighlightedPoints) {
            el.classList.remove("green");
        }
        for (const el of this.blueHighlightedPoints) {
            el.classList.remove("blue");
        }
        this.greenHighlightedPoints = [];
        this.blueHighlightedPoints = [];
        this.scoreboardDivs.highlighted.innerHTML = "";
        this.scoreboardDivs.found.innerHTML = "";
    }
    /** Returns the distance between two points */
    getDistance(a, b) {
        return Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
    }
    /** Place a new point on the board */
    placeNewPoint(x, y) {
        this.totalNumPoints++;
        this.scoreboardDivs.total.innerHTML = String(this.totalNumPoints);
        // construct a new red rectangle
        const newSquare = this.drawSquare(x, y);
        this.background.appendChild(newSquare);
        // add the point to the quad tree
        this.quadTree.addPoint({ el: newSquare, x: x, y: y });
        // add in any new boundaries that the quad tree may have created (in the event of a rebalance)
        this.drawBoundaries(this.quadTree.getNewBoundaries());
    }
    /** Creates a square div and centers it at the provided coordinates */
    drawSquare(x, y) {
        const newSquare = document.createElement("div");
        newSquare.classList.add("overlaySquare");
        newSquare.style.top = (y - this.squareSize / 2) + "px";
        newSquare.style.left = (x - this.squareSize / 2) + "px";
        newSquare.style.width = this.squareSize + "px";
        newSquare.style.height = this.squareSize + "px";
        return newSquare;
    }
    /** Draws boundary lines */
    drawBoundaries(boundaryList) {
        for (const boundary of boundaryList) {
            this.drawBoundary(boundary);
        }
    }
    /** Draw a rectangle bounding the provided coordinates */
    drawBoundary(boundary) {
        const width = boundary.bottomRight.x - boundary.topLeft.x;
        const height = boundary.bottomRight.y - boundary.topLeft.y;
        const newRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        newRect.setAttribute("x", String(boundary.topLeft.x));
        newRect.setAttribute("y", String(boundary.topLeft.y));
        newRect.setAttribute("width", String(width));
        newRect.setAttribute("height", String(height));
        newRect.setAttribute("class", "boundaryRectangle");
        this.boundaryOverlay.appendChild(newRect);
    }
}
document.addEventListener("DOMContentLoaded", () => { new QuadTreeDemo(); });
