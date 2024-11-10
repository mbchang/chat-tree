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
