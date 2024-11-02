// src/app/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Node,
  Edge,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

type ChatMessage = {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
};

type MessageNodeData = {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  onBranch: (messageId: string) => void;
};

// Define MessageNode outside the Page component
const MessageNode = ({ data }: { data: MessageNodeData }) => {
  const { chatHistory, onSendMessage, onBranch } = data;
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="p-4 border border-gray-300 rounded bg-white text-black max-w-xs relative">
      {/* Target Handle at the Top */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ top: -8, background: '#555' }}
      />

      {/* Chat History */}
      <div className="flex flex-col space-y-2 mb-2">
        {chatHistory.map((msg) => (
          <div key={msg.id} className="flex items-start">
            <div
              className={`p-2 rounded ${
                msg.sender === 'user' ? 'bg-gray-300' : 'bg-gray-200'
              } flex-1`}
            >
              {msg.content}
            </div>
            {msg.sender === 'assistant' && (
              <button
                onClick={() => {
                  console.log(
                    `Branch button clicked for messageId: ${msg.id}`
                  );
                  onBranch(msg.id);
                }}
                className="ml-2 px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Branch
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Input Field */}
      <div className="mt-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter your message"
          className="w-full p-2 border border-gray-300 rounded text-black placeholder:text-gray-600"
        />
        <button
          onClick={() => {
            if (inputValue.trim() !== '') {
              onSendMessage(inputValue);
              setInputValue('');
            }
          }}
          className="mt-2 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Send
        </button>
      </div>

      {/* Source Handle at the Bottom */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ bottom: -8, background: '#555' }}
      />
    </div>
  );
};

// Define nodeTypes outside the Page component
const nodeTypes = {
  messageNode: MessageNode,
};

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 250;
const nodeHeight = 300;

const getLayoutedNodesAndEdges = (
  nodes: Node[],
  edges: Edge[],
  direction = 'TB' // Top to Bottom
) => {
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: nodeHeight,
    });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes: layoutedNodes, edges };
};

const Page = () => {
  const [flowData, setFlowData] = useState<{
    nodes: Node[];
    edges: Edge[];
  }>({
    nodes: [],
    edges: [],
  });

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

      // Apply layout
      const layouted = getLayoutedNodesAndEdges(updatedNodes, edges);

      // Return updated flow data
      return {
        nodes: layouted.nodes,
        edges: layouted.edges,
      };
    });
  };

  const handleBranch = (nodeId: string, messageId: string) => {
    console.log(
      `handleBranch called with nodeId: ${nodeId}, messageId: ${messageId}`
    );

    setFlowData((prevFlowData) => {
      const { nodes, edges } = prevFlowData;

      const currentNode = nodes.find((n) => n.id === nodeId);
      if (!currentNode) return prevFlowData;

      const currentData = currentNode.data as MessageNodeData;
      const messageIndex = currentData.chatHistory.findIndex(
        (msg) => msg.id === messageId
      );

      if (messageIndex === -1) return prevFlowData;

      const beforeBranchChatHistory = currentData.chatHistory.slice(
        0,
        messageIndex + 1
      );
      const afterBranchChatHistory = currentData.chatHistory.slice(
        messageIndex + 1
      );

      const timestamp = Date.now();
      const branchNodeId = `${timestamp}-branch`;
      const continuationNodeId = `${timestamp}-continuation`;
      const newBranchNodeId = `${timestamp}-newbranch`;

      // Create nodes
      const branchNode: Node = {
        id: branchNodeId,
        type: 'messageNode',
        data: {
          chatHistory: beforeBranchChatHistory,
          onSendMessage: (message) =>
            handleSendMessage(branchNodeId, message),
          onBranch: (msgId) => handleBranch(branchNodeId, msgId),
        },
        position: { x: 0, y: 0 },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };

      const continuationNode: Node = {
        id: continuationNodeId,
        type: 'messageNode',
        data: {
          chatHistory: afterBranchChatHistory,
          onSendMessage: (message) =>
            handleSendMessage(continuationNodeId, message),
          onBranch: (msgId) =>
            handleBranch(continuationNodeId, msgId),
        },
        position: { x: 0, y: 0 },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };

      const newBranchNode: Node = {
        id: newBranchNodeId,
        type: 'messageNode',
        data: {
          chatHistory: beforeBranchChatHistory,
          onSendMessage: (message) =>
            handleSendMessage(newBranchNodeId, message),
          onBranch: (msgId) => handleBranch(newBranchNodeId, msgId),
        },
        position: { x: 0, y: 0 },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };

      // Create edges
      const continuationEdge: Edge = {
        id: `e${branchNodeId}-${continuationNodeId}`,
        source: branchNodeId,
        target: continuationNodeId,
        type: 'default',
        animated: true,
        style: { stroke: '#000', strokeWidth: 2 },
      };

      const newBranchEdge: Edge = {
        id: `e${branchNodeId}-${newBranchNodeId}`,
        source: branchNodeId,
        target: newBranchNodeId,
        type: 'default',
        animated: true,
        style: { stroke: '#000', strokeWidth: 2 },
      };

      // Adjust existing edges
      const updatedEdges = edges.map((edge) => {
        if (edge.target === nodeId) {
          return { ...edge, target: branchNodeId };
        }
        return edge;
      });

      // Remove current node
      const updatedNodes = nodes.filter((n) => n.id !== nodeId);

      // Add new nodes and edges
      const newNodes = [
        ...updatedNodes,
        branchNode,
        continuationNode,
        newBranchNode,
      ];
      const newEdges = [
        ...updatedEdges,
        continuationEdge,
        newBranchEdge,
      ];

      // Apply layout
      const layouted = getLayoutedNodesAndEdges(newNodes, newEdges);

      console.log('New Nodes:', layouted.nodes);
      console.log('New Edges:', layouted.edges);

      // Return updated flow data
      return {
        nodes: layouted.nodes,
        edges: layouted.edges,
      };
    });
  };

  // Initialize the initial node
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
      },
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };

    const layouted = getLayoutedNodesAndEdges([initialNode], []);

    setFlowData({
      nodes: layouted.nodes,
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
