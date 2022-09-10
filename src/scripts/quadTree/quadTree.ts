
export interface Coordinates{
	x: number;
	y: number;
}

abstract class Node{
	public topLeft: Coordinates;
	public bottomRight: Coordinates;
	public parentNode: ParentNode | null;

	public constructor(x1: number, y1: number, x2: number, y2: number)
	{
		this.topLeft = {x: x1, y: y1};
		this.bottomRight = {x: x2, y: y2};
		this.parentNode = null;
	}

	public containsPoint(point: Coordinates): boolean{
		return point.x >= this.topLeft.x && point.x < this.bottomRight.x && point.y >= this.topLeft.y && point.y < this.bottomRight.y;
	}

}

export class LeafNode<DataType extends Coordinates> extends Node{
	public payload: DataType[];
	public constructor(x1: number, y1: number, x2: number, y2: number)
	{
		super(x1, y1, x2, y2);
		this.payload = [];


	}

	public addPoint(point: DataType): number
	{
		this.payload.push(point);
		return this.payload.length;
	}

}

export class ParentNode extends Node{

	public children: Node[];

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

	public addChild(child: Node): number
	{
		child.parentNode = this;
		this.children.push(child);
		return this.children.length;
	}

	public removeChild(childToRemove: LeafNode<Coordinates>): void{
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

export class QuadTree<DataType extends Coordinates>{

	private root: Node;

	private nodeCapacity: number;

	private newBoundaries: {topLeft: Coordinates, bottomRight: Coordinates}[];

	public constructor(width: number, height: number, nodeCapacity: number)
	{
		this.root = new LeafNode<DataType>(0, 0, width, height);
		this.nodeCapacity = nodeCapacity;
		this.newBoundaries = [];
	}

	public addPoint(point: DataType)
	{
		// add the point to the tree
		this.addPointInner(this.root, point);
		// potentially rebalance
	}

	private addPointInner(root: Node, point: DataType)
	{
		const node = this.getRelevantLeafNode(this.root, point);

		const count = node.addPoint(point);

		if (count > this.nodeCapacity)
		{
			const pointsThatNeedRebalancing = node.payload;

			const parent = node.parentNode;

			let nodeToAddTo: ParentNode;


			if (parent == null)
			{
				this.root = nodeToAddTo = new ParentNode(this.root.topLeft.x, this.root.topLeft.y, this.root.bottomRight.x, this.root.bottomRight.y);
			}
			else
			{
				parent.removeChild(node);
				nodeToAddTo = new ParentNode(node.topLeft.x, node.topLeft.y, node.bottomRight.x, node.bottomRight.y);
				parent.addChild(nodeToAddTo);
			}

			for (const node of nodeToAddTo.children)
			{
				this.newBoundaries.push({topLeft: node.topLeft, bottomRight: node.bottomRight});
			}

			for (point of pointsThatNeedRebalancing)
			{
				// recursion, since in theory we may need to rebalance a second time, or maybe even more
				this.addPointInner(nodeToAddTo, point);
			}
		}
	}

	private getRelevantLeafNode(root: Node, point: DataType): LeafNode<DataType>{
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

	public getDataFromOverlappingPoints(topLeft: Coordinates, bottomRight: Coordinates): DataType[]
	{
		const result: DataType[] = [];
		this.recursiveHelper(this.root, topLeft, bottomRight, result);
		return result;
	}

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


	public getAllBoundaries(): {topLeft: Coordinates, bottomRight: Coordinates}[]
	{
		const result: {topLeft: Coordinates, bottomRight: Coordinates}[] = [];

		const queue = [this.root];

		while (queue.length > 0)
		{
			const cur = queue.shift() as Node;

			result.push({topLeft: cur.topLeft, bottomRight: cur.bottomRight});

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

	public getNewBoundaries(): {topLeft: Coordinates, bottomRight: Coordinates}[]
	{
		const result = JSON.parse(JSON.stringify(this.newBoundaries));
		this.newBoundaries = [];
		return result;
		
	}
}

