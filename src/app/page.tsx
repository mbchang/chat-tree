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
import MessageNode from '../components/MessageNode';
import { MessageNodeData } from '@/types/chat';
import {
  getLayoutedNodesAndEdges,
  updateIsLeaf,
  getDescendants,
  mergeNodes,
} from '@/utils/layout';

// Define nodeTypes outside the Page component
const nodeTypes = {
  messageNode: MessageNode,
};

const Page = () => {
  const [flowData, setFlowData] = useState<{
    nodes: Node[];
    edges: Edge[];
  }>({
    nodes: [],
    edges: [],
  });

  const handleDelete = (nodeId: string) => {
    setFlowData((prevFlowData) => {
      const { nodes, edges } = prevFlowData;

      // Check if the node is root (id === '1')
      const nodeToDelete = nodes.find((node) => node.id === nodeId);
      if (nodeToDelete?.data.isRoot) {
        return prevFlowData; // Don't delete if it's the root node
      }

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
