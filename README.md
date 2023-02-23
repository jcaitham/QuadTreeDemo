# QuadTreeDemo

This project implements a quad-tree data structure, and offers an interactive front-end React control for demonstrating how the quad-tree works.  I read about quad trees while studying for system design interviews, and decided I would implement one myself.  Quad trees are data structures used to efficiently index data across a 2d plane, such as restaurants on a map.  They work by representing a rectangular area as a tree node.  Once this node contains more than some N points, the node is split into 4 pieces, each representing a quadrant of the original rectangle, and the data points are rebalanced to the 4 new nodes.  This can be repeated indefinitely for larger data sets.  We can use the resulting tree to efficiently find all points within some distance D of a given (x,y) coordinate pair, by performing BFS on the tree and pruning all branches that don't fall within distance D of (x,y).  

The interactive front-end allows you to place data points by left-clicking.  The background will gradually split itself into smaller and smaller pieces rectangles, each representing a node in the tree.  By right-clicking, you can find all points within a certain radius of your click point (ala "find all restaurants within 10 miles of my location").  

To use the tool, you can `git clone` and then `npm install` followed by `npm start` to run the project.  Or you can use it as a package in your own project, by running `npm install quadtreecontrol@latest`, and then `import {QuadTreeDemo} from "quadtreecontrol".

