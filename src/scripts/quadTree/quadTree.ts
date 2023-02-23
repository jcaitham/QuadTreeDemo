
export interface Coordinates
{
	x: number;
	y: number;
}

abstract class Node
{
	public topLeft: Coordinates;
	public bottomRight: Coordinates;
	public parentNode: ParentNode | null;

	public constructor(x1: number, y1: number, x2: number, y2: number)
	{
		this.topLeft = { x: x1, y: y1 };
		this.bottomRight = { x: x2, y: y2 };
		this.parentNode = null;
	}

	/** Return true if the given coordinate pair exists within the space governed by this node */
	public containsPoint(point: Coordinates): boolean
	{
		return point.x >= this.topLeft.x && point.x < this.bottomRight.x && point.y >= this.topLeft.y && point.y < this.bottomRight.y;
	}

}

class LeafNode<DataType extends Coordinates> extends Node
{
	/** List of data being stored on this node.  Max size is governed by the nodeCapacity property on the QuadTree class */
	public payload: DataType[];
	public constructor(x1: number, y1: number, x2: number, y2: number)
	{
		super(x1, y1, x2, y2);
		this.payload = [];


	}

	/** Adds one data point to this node, and returns the total number of data points on the node */
	public addPoint(point: DataType): number
	{
		this.payload.push(point);
		return this.payload.length;
	}

}

class ParentNode extends Node
{

	public children: Node[];

	/** Construct a new parent node.  All parent nodes are initialized with 4 child leafNodes.  This is probably not optimal, but it is convenient */
	public constructor(x1: number, y1: number, x2: number, y2: number)
	{
		super(x1, y1, x2, y2);

		// starts off with 4 leaf nodes
		this.children = [];
		const midwayX = (x1 + x2) / 2;
		const midwayY = (y1 + y2) / 2;
		this.addChild(new LeafNode(x1, y1, midwayX, midwayY));  // top-left
		this.addChild(new LeafNode(midwayX, y1, x2, midwayY));  // top-right
		this.addChild(new LeafNode(x1, midwayY, midwayX, y2));  // bottom-left
		this.addChild(new LeafNode(midwayX, midwayY, x2, y2));  // bottom-right

	}

	/** Add a child node to this parent node */
	public addChild(child: Node): number
	{
		child.parentNode = this;
		this.children.push(child);
		return this.children.length;
	}

	/** Given a child leaf node, loop through this node's children and remove the target node from the children array */
	public removeChild(childToRemove: LeafNode<Coordinates>): void
	{
		for (let i = 0; i < this.children.length; i++)
		{
			const child = this.children[i];
			if (child.topLeft.x === childToRemove.topLeft.x && child.topLeft.y === childToRemove.topLeft.y && child.bottomRight.x === childToRemove.bottomRight.x && child.bottomRight.y === childToRemove.bottomRight.y)
			{
				this.children.splice(i, 1);
				break;
			}
		}
	}

}

/**
 * Implementation of the quadTree data structure.  Quad tree is used to "index" 2d coordinates, by repeatedly splitting an area into ever smaller sub-areas. 
 * This is represented as a tree structure, in which each node is associated with some subarea.  Each non-leaf node has 4 children, corresponding to the top-left, 
 * top-right, bottom-left, and bottom-right quarters of the parent.  This can repeat many times and divide the space into very small portions.  Leaf nodes   
 * have a list of data points of configurable size.  Given a coordinate, we can quickly find the LeafNode that contains it by traversing the tree
 */
export class QuadTree<DataType extends Coordinates>{

	/** Overall root node of the tree */
	private root: Node;

	/** Max capacity of each leafNode */
	private nodeCapacity: number;

	/** List of newly created node boundaries */
	private newBoundaries: { topLeft: Coordinates, bottomRight: Coordinates; }[];

	public constructor(width: number, height: number, nodeCapacity: number)
	{
		this.root = new LeafNode<DataType>(0, 0, width, height);
		this.newBoundaries = [{ topLeft: this.root.topLeft, bottomRight: this.root.bottomRight }];
		this.nodeCapacity = nodeCapacity;
	}

	/** 
	 * Checks whether we already have a data entry for the given coordinate pair.  We can't have multiple data points at the exact same position, 
	 * because once there are more than nodeCapacity of these overlapping points, we can't sub-divide the tree anymore 
	 */
	public containsData(coord: Coordinates): boolean
	{
		const node = this.getRelevantLeafNode(this.root, coord);

		for (const p of node.payload)
		{
			if (p.x == coord.x && p.y == coord.y)
			{
				return true;
			}
		}

		return false;
	}

	/**
	 * Public entry for adding a point to the tree
	 * @param point 
	 */
	public addPoint(point: DataType)
	{
		this.addPointInner(this.root, point);
	}

	/**
	 * Private method for adding a new point to the tree.  Handles injecting the point into the correct LeafNode, and rebalancing the tree if necessary
	 * @param root Node to start from - isn't necessarily the overall root, could be a child node as well
	 * @param point the point to add
	 */
	private addPointInner(root: Node, point: DataType)
	{
		// find the node that should contain point
		const node = this.getRelevantLeafNode(root, point);

		// add point to that node
		const count = node.addPoint(point);

		// if the node now has more points than nodeCapacity, we need to split the node up
		if (count > this.nodeCapacity)
		{
			//save off the data points in the node
			const pointsThatNeedRebalancing = node.payload;

			const parent = node.parentNode;

			let nodeToAddTo: ParentNode;


			// if the node's parent was null, that means we are at the root node.  We will make the root node into a ParentNode
			if (parent == null)
			{
				this.root = nodeToAddTo = new ParentNode(this.root.topLeft.x, this.root.topLeft.y, this.root.bottomRight.x, this.root.bottomRight.y);
			}
			else // otherwise, the node's parent was a ParentNode.  We need to remove the node from the parent's list, and replace it with a ParentNode
			{
				parent.removeChild(node);
				nodeToAddTo = new ParentNode(node.topLeft.x, node.topLeft.y, node.bottomRight.x, node.bottomRight.y);
				parent.addChild(nodeToAddTo);
			}

			// when we created the new parentNode, we also created some children LeafNodes for it.  We need to push the boundaries of these leafNodes into newBoundaries
			for (const node of nodeToAddTo.children)
			{
				this.newBoundaries.push({ topLeft: node.topLeft, bottomRight: node.bottomRight });
			}

			// Even though we split the node into 4 smaller nodes, it's possible that all of the points from the original node still get placed into the same smaller child node,
			// so we call this function recursively for each of the node's original payload to handle nested rebalances
			for (point of pointsThatNeedRebalancing)
			{
				this.addPointInner(nodeToAddTo, point);
			}
		}
	}

	/**
	 * Given a point, locate the leaf node that encompasses that point and return it
	 * @param root Node to start from.  Can be the overall tree root, or any other node within it.  This node IS expected to contain the point though
	 * @param point The point (coordinate pair) that we are searching for
	 */
	private getRelevantLeafNode(root: Node, point: Coordinates): LeafNode<DataType>
	{
		let cur = root;

		while (cur instanceof ParentNode)
		{
			for (const child of cur.children)
			{
				if (child.containsPoint(point))
				{
					cur = child;
					break;
				}
			}
		}

		return cur as LeafNode<DataType>;
	}

	/**
	 * Given a rectangle defined by two coordinate pairs, find and return the data payload from all nodes which
	 * overlap with that rectangle.
	 */
	public getDataFromOverlappingPoints(topLeft: Coordinates, bottomRight: Coordinates): DataType[]
	{
		const result: DataType[] = [];
		this.recursiveHelper(this.root, topLeft, bottomRight, result);
		return result;
	}

	/**
	 * Perform depth first search on the tree, searching for LeafNodes that overlap with the rectangle created by the topLeft/bottomRight coordinate pairs
	 * Places the payloads of all such LeafNodes into the result array
	 * @param curNode Node currently being processed in the DFS traversal
	 * @param result Pointer to an array that will store our list of data payloads
	 */
	private recursiveHelper(curNode: Node, topLeft: Coordinates, bottomRight: Coordinates, result: DataType[]): void
	{
		if (!this.hasOverlap(topLeft, bottomRight, curNode))
		{
			return;
		}
		else if (curNode instanceof LeafNode)
		{
			for (const point of curNode.payload)
			{
				result.push(point);
			}
		}
		else if (curNode instanceof ParentNode)
		{
			for (const child of curNode.children)
			{
				this.recursiveHelper(child, topLeft, bottomRight, result);
			}
		}
	}

	/**
	 * Returns whether a rectangle defined by the topLeft and bottomRight coordinate pairs has any overlap with the given node
	 */
	private hasOverlap(topLeft: Coordinates, bottomRight: Coordinates, node: Node)
	{
		if (topLeft.x > node.bottomRight.x || bottomRight.x < node.topLeft.x)
		{
			return false;
		}
		if (topLeft.y > node.bottomRight.y || bottomRight.y < node.topLeft.y)
		{
			return false;
		}

		return true;
	}


	/**
	 * Returns a list of all nodes, represented as their internal boundary pair
	 */
	public getAllBoundaries(): { topLeft: Coordinates, bottomRight: Coordinates; }[]
	{
		const result: { topLeft: Coordinates, bottomRight: Coordinates; }[] = [];

		const queue = [this.root];

		while (queue.length > 0)
		{
			const cur = queue.shift() as Node;

			result.push({ topLeft: cur.topLeft, bottomRight: cur.bottomRight });

			if (cur instanceof ParentNode)
			{
				for (const child of cur.children)
				{
					queue.push(child);
				}
			}
		}

		return result;
	}

	/**
	 * Returns a list of any nodes created since the last call to getNewBoundaries, represented as their internal boundary pair
	 */
	public getNewBoundaries(): { topLeft: Coordinates, bottomRight: Coordinates; }[]
	{
		const result = this.newBoundaries;
		this.newBoundaries = [];
		return result;
	}
}

