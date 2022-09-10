class Node {
    constructor(x1, y1, x2, y2) {
        this.topLeft = { x: x1, y: y1 };
        this.bottomRight = { x: x2, y: y2 };
        this.parentNode = null;
    }
    containsPoint(point) {
        return point.x >= this.topLeft.x && point.x < this.bottomRight.x && point.y >= this.topLeft.y && point.y < this.bottomRight.y;
    }
}
export class LeafNode extends Node {
    constructor(x1, y1, x2, y2) {
        super(x1, y1, x2, y2);
        this.payload = [];
    }
    addPoint(point) {
        this.payload.push(point);
        return this.payload.length;
    }
}
export class ParentNode extends Node {
    constructor(x1, y1, x2, y2) {
        super(x1, y1, x2, y2);
        // starts off with 4 leaf nodes
        this.children = [];
        const midwayX = (x1 + x2) / 2;
        const midwayY = (y1 + y2) / 2;
        this.addChild(new LeafNode(x1, y1, midwayX, midwayY)); // top-left
        this.addChild(new LeafNode(midwayX, y1, x2, midwayY)); // top-right
        this.addChild(new LeafNode(x1, midwayY, midwayX, y2)); // bottom-left
        this.addChild(new LeafNode(midwayX, midwayY, x2, y2)); // bottom-right
    }
    addChild(child) {
        child.parentNode = this;
        this.children.push(child);
        return this.children.length;
    }
    removeChild(childToRemove) {
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            if (child.topLeft.x === childToRemove.topLeft.x && child.topLeft.y === childToRemove.topLeft.y && child.bottomRight.x === childToRemove.bottomRight.x && child.bottomRight.y === childToRemove.bottomRight.y) {
                this.children.splice(i, 1);
                break;
            }
        }
    }
}
export class QuadTree {
    constructor(width, height, nodeCapacity) {
        this.root = new LeafNode(0, 0, width, height);
        this.nodeCapacity = nodeCapacity;
        this.newBoundaries = [];
    }
    addPoint(point) {
        // add the point to the tree
        this.addPointInner(this.root, point);
        // potentially rebalance
    }
    addPointInner(root, point) {
        const node = this.getRelevantLeafNode(this.root, point);
        const count = node.addPoint(point);
        if (count > this.nodeCapacity) {
            const pointsThatNeedRebalancing = node.payload;
            let parent = node.parentNode;
            let nodeToAddTo;
            if (parent == null) {
                this.root = nodeToAddTo = new ParentNode(this.root.topLeft.x, this.root.topLeft.y, this.root.bottomRight.x, this.root.bottomRight.y);
            }
            else {
                parent.removeChild(node);
                nodeToAddTo = new ParentNode(node.topLeft.x, node.topLeft.y, node.bottomRight.x, node.bottomRight.y);
                parent.addChild(nodeToAddTo);
            }
            for (const node of nodeToAddTo.children) {
                this.newBoundaries.push({ topLeft: node.topLeft, bottomRight: node.bottomRight });
            }
            for (point of pointsThatNeedRebalancing) {
                // recursion, since in theory we may need to rebalance a second time, or maybe even more
                this.addPointInner(nodeToAddTo, point);
            }
            // rebalance
        }
    }
    getRelevantLeafNode(root, point) {
        let cur = root;
        while (cur instanceof ParentNode) {
            for (let child of cur.children) {
                if (child.containsPoint(point)) {
                    cur = child;
                    break;
                }
            }
        }
        return cur;
    }
    getDataFromOverlappingPoints(topLeft, bottomRight) {
        let result = [];
        this.recursiveHelper(this.root, topLeft, bottomRight, result);
        return result;
    }
    recursiveHelper(curNode, topLeft, bottomRight, result) {
        if (!this.hasOverlap(topLeft, bottomRight, curNode)) {
            return;
        }
        else if (curNode instanceof LeafNode) {
            for (const point of curNode.payload) {
                result.push(point);
            }
        }
        else if (curNode instanceof ParentNode) {
            for (const child of curNode.children) {
                this.recursiveHelper(child, topLeft, bottomRight, result);
            }
        }
    }
    hasOverlap(topLeft, bottomRight, node) {
        if (topLeft.x > node.bottomRight.x || bottomRight.x < node.topLeft.x) {
            return false;
        }
        if (topLeft.y > node.bottomRight.y || bottomRight.y < node.topLeft.y) {
            return false;
        }
        return true;
    }
    getAllBoundaries() {
        const result = [];
        const queue = [this.root];
        while (queue.length > 0) {
            const cur = queue.shift();
            result.push({ topLeft: cur.topLeft, bottomRight: cur.bottomRight });
            if (cur instanceof ParentNode) {
                for (const child of cur.children) {
                    queue.push(child);
                }
            }
        }
        return result;
    }
    getNewBoundaries() {
        let result = JSON.parse(JSON.stringify(this.newBoundaries));
        this.newBoundaries = [];
        return result;
    }
}
