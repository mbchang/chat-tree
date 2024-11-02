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
                onClick={() => onBranch(msg.id)}
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
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const handleSendMessage = (nodeId: string, message: string) => {
    setNodes((currentNodes) => {
      // Update the specific node's chat history
      const updatedNodes = currentNodes.map((node) => {
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

      // Return the updated nodes; the layout will be applied in useEffect
      return updatedNodes;
    });
  };

  const handleBranch = (nodeId: string, messageId: string) => {
    const parentNode = nodes.find((n) => n.id === nodeId);
    if (!parentNode) return;

    const parentData = parentNode.data as MessageNodeData;
    const messageIndex = parentData.chatHistory.findIndex(
      (msg) => msg.id === messageId
    );

    if (messageIndex === -1) return;

    // Create new chat history up to the selected message
    const newChatHistory = parentData.chatHistory.slice(
      0,
      messageIndex + 1
    );

    // Create new node
    const newNodeId = `${Date.now()}-branch`;
    const newNode: Node = {
      id: newNodeId,
      type: 'messageNode',
      data: {
        chatHistory: newChatHistory,
        onSendMessage: (message) =>
          handleSendMessage(newNodeId, message),
        onBranch: (msgId) => handleBranch(newNodeId, msgId),
      },
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };

    // Create new edge
    const newEdge: Edge = {
      id: `e${nodeId}-${newNodeId}`,
      source: nodeId,
      target: newNodeId,
      type: 'default',
      animated: true,
      style: { stroke: '#000', strokeWidth: 2 },
    };

    // Update nodes and edges
    setNodes((currentNodes) => [...currentNodes, newNode]);
    setEdges((currentEdges) => [...currentEdges, newEdge]);
  };

  // Apply layout whenever nodes or edges change
  useEffect(() => {
    const layouted = getLayoutedNodesAndEdges(nodes, edges);
    setNodes(layouted.nodes);
  }, [nodes.length, edges.length]);

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

    setNodes([initialNode]);
  }, []);

  return (
    <div className="h-screen relative">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
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
