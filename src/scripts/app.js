import { QuadTree } from "./quadTree/quadTree.js";
export class QuadTreeDemo {
    constructor() {
        this.squareSize = 10;
        this.totalNumPoints = 0;
        this.preventMouseEvent = false;
        this.height = document.body.clientHeight;
        this.width = document.body.clientWidth;
        this.quadTree = new QuadTree(this.width, this.height, 4);
        this.radius = this.width / 10;
        this.highlightedPoints = [];
        this.grid = [];
        for (let i = 0; i < this.width; i += this.squareSize) {
            this.grid[i] = [];
        }
        this.boundaryOverlay = document.getElementById("boundaryOverlay");
        this.background = document.getElementById("background");
        this.userOverlay = document.getElementById("userOverlay");
        this.scoreboardDivs = {
            total: document.getElementById("totalPointsCounter"),
            found: document.getElementById("foundPointsCounter"),
            highlighted: document.getElementById("highlightedPointsCounter")
        };
        this.background.addEventListener("mousedown", this.onClick.bind(this));
        this.background.addEventListener("mousemove", this.onMouseMove.bind(this));
        this.background.addEventListener("contextmenu", this.stopEvent.bind(this));
    }
    onClick(event) {
        this.clearHighlights(this.highlightedPoints);
        const x = Math.floor(event.clientX / this.squareSize) * this.squareSize;
        const y = Math.floor(event.clientY / this.squareSize) * this.squareSize;
        if (event.button === 2) // right-click
         {
            this.findNearbyPoints(x, y, this.radius);
        }
        else if (event.buttons === 1 && !this.preventMouseEvent) {
            this.placeNewPoint(x, y);
        }
        event.preventDefault();
        event.stopPropagation();
    }
    onMouseMove(event) {
        const x = Math.floor(event.clientX / this.squareSize) * this.squareSize;
        const y = Math.floor(event.clientY / this.squareSize) * this.squareSize;
        if (event.buttons === 1 && !this.preventMouseEvent) {
            this.placeNewPoint(x, y);
            this.preventMouseEvent = true;
            setTimeout(() => { this.preventMouseEvent = false; }, 40);
        }
    }
    stopEvent(event) {
        event.preventDefault();
        event.stopPropagation();
    }
    findNearbyPoints(x, y, radius) {
        const point = { x: x, y: y };
        const topLeft = { x: point.x - radius, y: point.y - radius };
        const bottomRight = { x: point.x + radius, y: point.y + radius };
        const pointList = this.quadTree.getDataFromOverlappingPoints(topLeft, bottomRight);
        this.scoreboardDivs.found.innerHTML = String(pointList.length);
        const greenCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        greenCircle.setAttribute("cx", String(x));
        greenCircle.setAttribute("cy", String(y));
        greenCircle.setAttribute("r", String(radius));
        greenCircle.classList.add("greenCircle");
        this.userOverlay.appendChild(greenCircle);
        for (const p of pointList) {
            if (this.getDistance(point, p) <= radius) {
                this.highlightedPoints.push(p.el);
            }
        }
        this.highlightPoints(this.highlightedPoints);
        this.scoreboardDivs.highlighted.innerHTML = String(this.highlightedPoints.length);
    }
    highlightPoints(elements) {
        for (const el of elements) {
            el.classList.add("highlight");
        }
    }
    clearHighlights(elements) {
        this.userOverlay.innerHTML = "";
        for (const el of elements) {
            el.classList.remove("highlight");
        }
        this.highlightedPoints = [];
    }
    getDistance(a, b) {
        return Math.sqrt((b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y));
    }
    placeNewPoint(x, y) {
        if (this.grid[x][y] === 1) {
            return;
        }
        this.grid[x][y] = 1;
        this.totalNumPoints++;
        this.scoreboardDivs.total.innerHTML = String(this.totalNumPoints);
        const newSquare = this.drawSquare(x, y);
        this.background.appendChild(newSquare);
        this.quadTree.addPoint({ el: newSquare, x: x, y: y });
        this.drawBoundaries(this.quadTree.getNewBoundaries());
    }
    drawSquare(x, y) {
        const newSquare = document.createElement("div");
        newSquare.classList.add("overlaySquare");
        newSquare.style.top = y + "px";
        newSquare.style.left = x + "px";
        newSquare.style.width = this.squareSize + "px";
        newSquare.style.height = this.squareSize + "px";
        return newSquare;
    }
    drawBoundaries(boundaryList) {
        //this.boundaryOverlay.innerHTML = "";
        for (const boundary of boundaryList) {
            this.drawBoundary(boundary);
        }
    }
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
