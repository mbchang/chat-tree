// src/app/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Node,
  Edge,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import MessageNode from '../components/MessageNode';
import {
  maxNodeHeight,
  baseNodeHeight,
  messageHeight,
  nodeWidth,
  minHeight,
} from '@/constants/layout';
import { MessageNodeData } from '@/types/chat';

// Define nodeTypes outside the Page component
const nodeTypes = {
  messageNode: MessageNode,
};

const getLayoutedNodesAndEdges = (
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

const updateIsLeaf = (nodes: Node[], edges: Edge[]) => {
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

const Page = () => {
  const [flowData, setFlowData] = useState<{
    nodes: Node[];
    edges: Edge[];
  }>({
    nodes: [],
    edges: [],
  });

  const mergeNodes = (nodes: Node[], edges: Edge[]) => {
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
          const parentNode = mergedNodes.find(
            (n) => n.id === parentId
          );
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

  // Helper function to get all descendants of a node
  function getDescendants(nodeId: string, edges: Edge[]): string[] {
    const children = edges
      .filter((edge) => edge.source === nodeId)
      .map((edge) => edge.target);

    const descendants = [...children];
    children.forEach((childId) => {
      descendants.push(...getDescendants(childId, edges));
    });

    return descendants;
  }

  const handleDelete = (nodeId: string) => {
    setFlowData((prevFlowData) => {
      const { nodes, edges } = prevFlowData;

      // Check if the node is root (id === '1')
      const nodeToDelete = nodes.find((node) => node.id === nodeId);
      if (nodeToDelete?.data.isRoot) {
        return prevFlowData; // Don't delete if it's the root node
      }

      // Helper function to get all descendant nodes
      const getDescendants = (
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

      // Get all nodes to delete
      const nodesToDelete = [
        nodeId,
        ...getDescendants(nodeId, edges),
      ];

      // Filter out the deleted nodes and edges
      let updatedNodes = nodes.filter(
        (node) => !nodesToDelete.includes(node.id)
      );
      let updatedEdges = edges.filter(
        (edge) =>
          !nodesToDelete.includes(edge.source) &&
          !nodesToDelete.includes(edge.target)
      );

      // Merge nodes where parent has single child
      const { nodes: mergedNodes, edges: mergedEdges } = mergeNodes(
        updatedNodes,
        updatedEdges
      );

      // Apply layout
      const layouted = getLayoutedNodesAndEdges(
        mergedNodes,
        mergedEdges
      );

      // Update isLeaf status
      const nodesWithIsLeaf = updateIsLeaf(
        layouted.nodes,
        layouted.edges
      );

      return {
        nodes: nodesWithIsLeaf,
        edges: layouted.edges,
      };
    });
  };

  const handleSendMessage = (nodeId: string, message: string) => {
    setFlowData((prevFlowData) => {
      const { nodes, edges } = prevFlowData;

      const updatedNodes = nodes.map((node) => {
        if (node.id === nodeId) {
          const nodeData = node.data as MessageNodeData;
          const newChatHistory = [
            ...nodeData.chatHistory,
            {
              id: `msg-${Date.now()}-user`,
              sender: 'user',
              content: message,
            },
            {
              id: `msg-${Date.now()}-assistant`,
              sender: 'assistant',
              content: `Assistant response to: ${message}`,
            },
          ];
          return {
            ...node,
            data: {
              ...nodeData,
              chatHistory: newChatHistory,
            },
          };
        }
        return node;
      });

      const layouted = getLayoutedNodesAndEdges(updatedNodes, edges);
      const nodesWithIsLeaf = updateIsLeaf(
        layouted.nodes,
        layouted.edges
      );

      return {
        nodes: nodesWithIsLeaf,
        edges: layouted.edges,
      };
    });
  };

  const handleBranch = (nodeId: string, messageId: string) => {
    setFlowData((prevFlowData) => {
      const { nodes, edges } = prevFlowData;

      const originalNodeIndex = nodes.findIndex(
        (n) => n.id === nodeId
      );
      if (originalNodeIndex === -1) return prevFlowData;

      const originalNode = nodes[originalNodeIndex];
      const originalData = originalNode.data as MessageNodeData;
      const messageIndex = originalData.chatHistory.findIndex(
        (msg) => msg.id === messageId
      );

      if (messageIndex === -1) return prevFlowData;

      const timestamp = Date.now();
      const branchNodeId = `${timestamp}-branch`;
      const continuationNodeId = `${timestamp}-continuation`;
      const newBranchNodeId = `${timestamp}-newbranch`;

      const chatHistoryUpToBranch = originalData.chatHistory.slice(
        0,
        messageIndex + 1
      );
      const chatHistoryAfterBranch = originalData.chatHistory.slice(
        messageIndex + 1
      );

      const branchNode: Node = {
        id: branchNodeId,
        type: 'messageNode',
        data: {
          chatHistory: chatHistoryUpToBranch,
          onSendMessage: (message) =>
            handleSendMessage(branchNodeId, message),
          onBranch: (msgId) => handleBranch(branchNodeId, msgId),
          onDelete: handleDelete,
          isLeaf: true,
          isRoot: originalData.isRoot, // Preserve isRoot status
        },
        position: originalNode.position,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };

      const updatedNodes = [...nodes];
      updatedNodes[originalNodeIndex] = branchNode;

      const updatedEdges = edges.map((edge) => {
        if (edge.target === nodeId) {
          return { ...edge, target: branchNodeId };
        }
        return edge;
      });

      const newEdges: Edge[] = [];

      if (chatHistoryAfterBranch.length > 0) {
        const continuationNode: Node = {
          id: continuationNodeId,
          type: 'messageNode',
          data: {
            chatHistory: chatHistoryAfterBranch,
            onSendMessage: (message) =>
              handleSendMessage(continuationNodeId, message),
            onBranch: (msgId) =>
              handleBranch(continuationNodeId, msgId),
            onDelete: handleDelete,
            isLeaf: true,
            isRoot: false, // New continuation should never be root
          },
          position: {
            x: branchNode.position.x,
            y: branchNode.position.y + 200,
          },
          sourcePosition: Position.Bottom,
          targetPosition: Position.Top,
        };

        updatedNodes.push(continuationNode);

        newEdges.push({
          id: `e${branchNodeId}-${continuationNodeId}`,
          source: branchNodeId,
          target: continuationNodeId,
          type: 'default',
          animated: true,
          style: { stroke: '#000', strokeWidth: 2 },
        });

        edges.forEach((edge) => {
          if (edge.source === nodeId) {
            updatedEdges.push({
              ...edge,
              source: continuationNodeId,
            });
          }
        });
      } else {
        edges.forEach((edge) => {
          if (edge.source === nodeId) {
            updatedEdges.push({ ...edge, source: branchNodeId });
          }
        });
      }

      const branchOutEdges = updatedEdges.filter(
        (e) => e.source === branchNodeId
      );
      const numExistingBranches = branchOutEdges.length;

      const newBranchNode: Node = {
        id: newBranchNodeId,
        type: 'messageNode',
        data: {
          chatHistory: [],
          onSendMessage: (message) =>
            handleSendMessage(newBranchNodeId, message),
          onBranch: (msgId) => handleBranch(newBranchNodeId, msgId),
          onDelete: handleDelete,
          isLeaf: true,
          isRoot: false, // New branch should never be root
        },
        position: {
          x: branchNode.position.x + 300 * numExistingBranches,
          y: branchNode.position.y + 200,
        },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };

      updatedNodes.push(newBranchNode);

      newEdges.push({
        id: `e${branchNodeId}-${newBranchNodeId}`,
        source: branchNodeId,
        target: newBranchNodeId,
        type: 'default',
        animated: true,
        style: { stroke: '#000', strokeWidth: 2 },
      });

      const allEdges = [...updatedEdges, ...newEdges];
      const layouted = getLayoutedNodesAndEdges(
        updatedNodes,
        allEdges
      );
      const nodesWithIsLeaf = updateIsLeaf(
        layouted.nodes,
        layouted.edges
      );

      return {
        nodes: nodesWithIsLeaf,
        edges: layouted.edges,
      };
    });
  };

  useEffect(() => {
    const initialNode: Node = {
      id: '1',
      type: 'messageNode',
      data: {
        chatHistory: [
          {
            id: 'msg-1',
            sender: 'assistant',
            content: 'Hello! How can I assist you today?',
          },
        ],
        onSendMessage: (message) => handleSendMessage('1', message),
        onBranch: (messageId) => handleBranch('1', messageId),
        onDelete: handleDelete,
        isLeaf: true,
        isRoot: true, // Add isRoot flag for the initial node
      },
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };

    const layouted = getLayoutedNodesAndEdges([initialNode], []);
    const nodesWithIsLeaf = updateIsLeaf(layouted.nodes, []);

    setFlowData({
      nodes: nodesWithIsLeaf,
      edges: [],
    });
  }, []);

  return (
    <div className="h-screen relative">
      <ReactFlowProvider>
        <ReactFlow
          nodes={flowData.nodes}
          edges={flowData.edges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.01}
          translateExtent={[
            [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
            [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
          ]}
          style={{ backgroundColor: '#fff' }}
        >
          <MiniMap />
          <Controls />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default Page;
