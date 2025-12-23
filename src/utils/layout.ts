import dagre from 'dagre';
import { Node, Edge } from 'reactflow';
import { MessageNodeData } from '@/types/chat';
import {
  baseNodeHeight,
  messageHeight,
  nodeWidth,
  minHeight,
  maxNodeHeight,
} from '@/constants/layout';

/**
 * Builds parent-to-children mapping from edges
 */
const buildChildrenMap = (edges: Edge[]): Map<string, string[]> => {
  const childrenMap = new Map<string, string[]>();
  edges.forEach((edge) => {
    const children = childrenMap.get(edge.source) || [];
    children.push(edge.target);
    childrenMap.set(edge.source, children);
  });
  return childrenMap;
};

/**
 * Finds the root node (node with no incoming edges)
 */
const findRootNode = (nodes: Node[], edges: Edge[]): Node | undefined => {
  const targetIds = new Set(edges.map((e) => e.target));
  return nodes.find((node) => !targetIds.has(node.id));
};

/**
 * Shifts a node and all its descendants by a given x offset
 */
const shiftSubtree = (
  nodeId: string,
  xOffset: number,
  nodesMap: Map<string, Node>,
  childrenMap: Map<string, string[]>
): void => {
  const node = nodesMap.get(nodeId);
  if (!node) return;

  node.position.x += xOffset;

  const children = childrenMap.get(nodeId) || [];
  children.forEach((childId) => {
    shiftSubtree(childId, xOffset, nodesMap, childrenMap);
  });
};

/**
 * Centers children under their parent, processing from top to bottom.
 * This shifts entire subtrees to maintain the tree structure.
 */
const centerChildrenUnderParents = (
  nodes: Node[],
  edges: Edge[]
): Node[] => {
  if (nodes.length === 0) return nodes;

  const childrenMap = buildChildrenMap(edges);
  const nodesMap = new Map<string, Node>(
    nodes.map((node) => [node.id, { ...node, position: { ...node.position } }])
  );

  const rootNode = findRootNode(nodes, edges);
  if (!rootNode) return nodes;

  // Process nodes level by level using BFS
  const queue: string[] = [rootNode.id];

  while (queue.length > 0) {
    const parentId = queue.shift()!;
    const parent = nodesMap.get(parentId);
    if (!parent) continue;

    const childIds = childrenMap.get(parentId) || [];
    if (childIds.length === 0) continue;

    // Add children to queue for processing their children next
    queue.push(...childIds);

    // Calculate the parent's center X
    const parentCenterX = parent.position.x + nodeWidth / 2;

    // Calculate the current bounding box of all children
    const childNodes = childIds
      .map((id) => nodesMap.get(id))
      .filter((n): n is Node => n !== undefined);

    if (childNodes.length === 0) continue;

    const minChildX = Math.min(...childNodes.map((n) => n.position.x));
    const maxChildX = Math.max(
      ...childNodes.map((n) => n.position.x + nodeWidth)
    );
    const childrenCenterX = (minChildX + maxChildX) / 2;

    // Calculate offset needed to center children under parent
    const offset = parentCenterX - childrenCenterX;

    // Shift each child's entire subtree
    if (Math.abs(offset) > 0.001) {
      childIds.forEach((childId) => {
        shiftSubtree(childId, offset, nodesMap, childrenMap);
      });
    }
  }

  return Array.from(nodesMap.values());
};

export const getLayoutedNodesAndEdges = (
  nodes: Node[],
  edges: Edge[],
  direction = 'TB' // Top to Bottom
) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Increase vertical spacing between nodes
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 100, // Horizontal spacing between nodes
    ranksep: 200, // Vertical spacing between ranks
  });

  // Calculate node dimensions
  nodes.forEach((node) => {
    const nodeData = node.data as MessageNodeData;
    const numMessages = nodeData.chatHistory.length;

    // Calculate height with padding and constraints
    const estimatedHeight = Math.min(
      maxNodeHeight,
      Math.max(
        minHeight,
        baseNodeHeight + numMessages * messageHeight
      )
    );

    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: estimatedHeight,
      paddingLeft: 20,
      paddingRight: 20,
      paddingTop: 20,
      paddingBottom: 20,
    });
  });

  // Add edges to the graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run the layout algorithm
  dagre.layout(dagreGraph);

  // Update node positions with the layout results
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    const nodeHeight = nodeWithPosition.height;

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeHeight,
      },
      style: {
        width: nodeWidth,
        height: nodeHeight,
      },
    };
  });

  // Post-process to center children under their parents
  const centeredNodes = centerChildrenUnderParents(layoutedNodes, edges);

  return {
    nodes: centeredNodes,
    edges: edges.map((edge) => ({
      ...edge,
      type: edge.type || 'tree',
      style: {
        ...edge.style,
        strokeWidth: 2,
        stroke: '#555',
      },
    })),
  };
};

/**
 * Calculate the depth of each node in the tree (distance from root)
 */
const calculateDepths = (
  nodes: Node[],
  edges: Edge[]
): Map<string, number> => {
  const depths = new Map<string, number>();
  const targetIds = new Set(edges.map((e) => e.target));

  // Find root node (no incoming edges)
  const rootNode = nodes.find((node) => !targetIds.has(node.id));
  if (!rootNode) return depths;

  // BFS to calculate depths
  const queue: { id: string; depth: number }[] = [{ id: rootNode.id, depth: 0 }];
  const childrenMap = new Map<string, string[]>();

  edges.forEach((edge) => {
    const children = childrenMap.get(edge.source) || [];
    children.push(edge.target);
    childrenMap.set(edge.source, children);
  });

  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    depths.set(id, depth);

    const children = childrenMap.get(id) || [];
    children.forEach((childId) => {
      queue.push({ id: childId, depth: depth + 1 });
    });
  }

  return depths;
};

export const updateIsLeaf = (nodes: Node[], edges: Edge[]) => {
  const sourceIds = new Set(edges.map((edge) => edge.source));
  const depths = calculateDepths(nodes, edges);

  const updatedNodes = nodes.map((node) => {
    const isLeaf = !sourceIds.has(node.id);
    const nodeData = node.data as MessageNodeData;
    return {
      ...node,
      data: {
        ...nodeData,
        isLeaf,
        depth: depths.get(node.id) ?? 0,
      },
    };
  });
  return updatedNodes;
};

export const getDescendants = (
  nodeId: string,
  edges: Edge[]
): string[] => {
  const children = edges
    .filter((edge) => edge.source === nodeId)
    .map((edge) => edge.target);

  const descendants = [...children];
  children.forEach((childId) => {
    descendants.push(...getDescendants(childId, edges));
  });

  return descendants;
};

export const mergeNodes = (
  nodes: Node[],
  edges: Edge[]
): { nodes: Node[]; edges: Edge[] } => {
  let merged = true;
  let mergedNodes = [...nodes];
  let mergedEdges = [...edges];
  const processedPairs = new Set<string>();

  const buildRelationshipMaps = () => {
    const nodeChildMap = new Map<string, string[]>();
    const nodeParentMap = new Map<string, string[]>();

    mergedEdges.forEach((edge) => {
      nodeChildMap.set(edge.source, [
        ...(nodeChildMap.get(edge.source) || []),
        edge.target,
      ]);
      nodeParentMap.set(edge.target, [
        ...(nodeParentMap.get(edge.target) || []),
        edge.source,
      ]);
    });

    return { nodeChildMap, nodeParentMap };
  };

  while (merged) {
    merged = false;
    const { nodeChildMap, nodeParentMap } = buildRelationshipMaps();
    const mergeablePairs: Array<[string, string]> = [];

    nodeChildMap.forEach((children, nodeId) => {
      if (children.length === 1) {
        const childId = children[0];
        const pairKey = `${nodeId}-${childId}`;

        if (processedPairs.has(pairKey)) return;

        const childParents = nodeParentMap.get(childId) || [];
        if (childParents.length === 1) {
          const childDescendants = getDescendants(
            childId,
            mergedEdges
          );
          if (!childDescendants.includes(nodeId)) {
            mergeablePairs.push([nodeId, childId]);
          }
        }
      }
    });

    if (mergeablePairs.length > 0) {
      merged = true;

      mergeablePairs.forEach(([parentId, childId]) => {
        const parentNode = mergedNodes.find((n) => n.id === parentId);
        const childNode = mergedNodes.find((n) => n.id === childId);

        if (parentNode && childNode) {
          processedPairs.add(`${parentId}-${childId}`);

          const parentData = parentNode.data as MessageNodeData;
          const childData = childNode.data as MessageNodeData;

          const mergedNode: Node = {
            ...parentNode,
            data: {
              ...parentData,
              chatHistory: [
                ...parentData.chatHistory,
                ...childData.chatHistory,
              ],
              isLeaf: childData.isLeaf,
            },
          };

          mergedNodes = mergedNodes.filter(
            (n) => n.id !== parentId && n.id !== childId
          );
          mergedNodes.push(mergedNode);

          mergedEdges = mergedEdges.filter(
            (e) => e.source !== parentId && e.target !== childId
          );

          const childOutgoingEdges = edges.filter(
            (e) => e.source === childId
          );
          childOutgoingEdges.forEach((e) => {
            mergedEdges.push({ ...e, source: parentId });
          });
        }
      });
    }
  }

  return { nodes: mergedNodes, edges: mergedEdges };
};
