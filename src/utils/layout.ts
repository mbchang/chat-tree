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
    rankwidth: 1000, // Width available for each rank
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

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - nodeWidth / 2,
        y: nodeWithPosition.y - nodeWithPosition.height / 2,
      },
      style: {
        width: nodeWidth,
        height: nodeWithPosition.height,
      },
    };
  });

  return {
    nodes: layoutedNodes,
    edges: edges.map((edge) => ({
      ...edge,
      style: {
        ...edge.style,
        strokeWidth: 2,
        stroke: '#555',
      },
    })),
  };
};

export const updateIsLeaf = (nodes: Node[], edges: Edge[]) => {
  const sourceIds = new Set(edges.map((edge) => edge.source));
  const updatedNodes = nodes.map((node) => {
    const isLeaf = !sourceIds.has(node.id);
    const nodeData = node.data as MessageNodeData;
    return {
      ...node,
      data: {
        ...nodeData,
        isLeaf,
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

export const mergeNodes = (nodes: Node[], edges: Edge[]) => {
  let merged = true;
  let mergedNodes = [...nodes];
  let mergedEdges = [...edges];
  const processedPairs = new Set<string>();

  while (merged) {
    merged = false;

    // Build node relationship maps
    const nodeChildCount = new Map<string, string[]>();
    const nodeParentCount = new Map<string, string[]>();

    mergedEdges.forEach((edge) => {
      // Track children
      const children = nodeChildCount.get(edge.source) || [];
      children.push(edge.target);
      nodeChildCount.set(edge.source, children);

      // Track parents
      const parents = nodeParentCount.get(edge.target) || [];
      parents.push(edge.source);
      nodeParentCount.set(edge.target, parents);
    });

    // First pass: identify all mergeable nodes
    const mergeablePairs: Array<[string, string]> = [];

    for (const [nodeId, children] of nodeChildCount.entries()) {
      if (children.length === 1) {
        const childId = children[0];
        const pairKey = `${nodeId}-${childId}`;

        if (processedPairs.has(pairKey)) continue;

        const childParents = nodeParentCount.get(childId) || [];
        if (childParents.length === 1) {
          // Check for circular references
          const childDescendants = getDescendants(
            childId,
            mergedEdges
          );
          if (!childDescendants.includes(nodeId)) {
            mergeablePairs.push([nodeId, childId]);
          }
        }
      }
    }

    // Second pass: perform merges
    if (mergeablePairs.length > 0) {
      merged = true;

      for (const [parentId, childId] of mergeablePairs) {
        const parentNode = mergedNodes.find((n) => n.id === parentId);
        const childNode = mergedNodes.find((n) => n.id === childId);

        if (parentNode && childNode) {
          const pairKey = `${parentId}-${childId}`;
          processedPairs.add(pairKey);

          // Create merged node
          const mergedNode: Node = {
            ...parentNode,
            data: {
              ...parentNode.data,
              chatHistory: [
                ...(parentNode.data as MessageNodeData).chatHistory,
                ...(childNode.data as MessageNodeData).chatHistory,
              ],
              isLeaf: (childNode.data as MessageNodeData).isLeaf,
            },
          };

          // Update nodes array
          mergedNodes = mergedNodes.filter(
            (n) => n.id !== parentId && n.id !== childId
          );
          mergedNodes.push(mergedNode);

          // Update edges
          mergedEdges = mergedEdges.filter(
            (e) => e.source !== parentId && e.target !== childId
          );

          // Redirect child's outgoing edges to merged node
          const childOutgoingEdges = edges.filter(
            (e) => e.source === childId
          );
          childOutgoingEdges.forEach((edge) => {
            mergedEdges.push({
              ...edge,
              source: parentId,
            });
          });
        }
      }
    }
  }

  return { nodes: mergedNodes, edges: mergedEdges };
};
