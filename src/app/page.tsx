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
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';

type MessageNodeData = {
  message: string;
  sender: 'user' | 'assistant';
  onBranch: () => void;
};

// Define MessageNode outside the Page component
const MessageNode = ({ data }: { data: MessageNodeData }) => {
  const { message, sender, onBranch } = data;
  return (
    <div
      className={`p-4 border border-gray-300 rounded ${
        sender === 'user' ? 'bg-gray-300' : 'bg-gray-200'
      } text-black max-w-xs relative text-center`}
    >
      {/* Target Handle at the Top */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ top: -8, background: '#555' }}
      />
      <div>{message}</div>
      {sender === 'assistant' && (
        <button
          onClick={onBranch}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600"
        >
          Branch
        </button>
      )}
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

const nodeWidth = 220;
const nodeHeight = 100;

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
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [inputValue, setInputValue] = useState('');
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(
    null
  );

  const handleBranch = (nodeId: string) => {
    setCurrentNodeId(nodeId);
  };

  // Initialize the initial node
  useEffect(() => {
    const initialNode: Node = {
      id: '1',
      type: 'messageNode',
      data: {
        message: 'Hello! How can I assist you today?',
        sender: 'assistant',
        onBranch: () => handleBranch('1'),
      },
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };

    const layouted = getLayoutedNodesAndEdges([initialNode], []);

    setNodes(layouted.nodes);
  }, []);

  const submitMessage = () => {
    if (inputValue && currentNodeId) {
      const timestamp = Date.now();
      const userNodeId = `${timestamp}-user`;
      const assistantNodeId = `${timestamp}-assistant`;

      const userNode: Node = {
        id: userNodeId,
        type: 'messageNode',
        data: {
          message: inputValue,
          sender: 'user',
          onBranch: () => handleBranch(userNodeId),
        },
        position: { x: 0, y: 0 },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };

      const assistantMessage = 'Assistant response to: ' + inputValue;
      const assistantNode: Node = {
        id: assistantNodeId,
        type: 'messageNode',
        data: {
          message: assistantMessage,
          sender: 'assistant',
          onBranch: () => handleBranch(assistantNodeId),
        },
        position: { x: 0, y: 0 },
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };

      const edgeStyle = { stroke: '#000', strokeWidth: 2 };

      const userEdge: Edge = {
        id: `e${currentNodeId}-${userNodeId}`,
        source: currentNodeId,
        target: userNodeId,
        type: 'default',
        animated: true,
        style: edgeStyle,
      };

      const assistantEdge: Edge = {
        id: `e${userNodeId}-${assistantNodeId}`,
        source: userNodeId,
        target: assistantNodeId,
        type: 'default',
        animated: true,
        style: edgeStyle,
      };

      const newNodes = [...nodes, userNode, assistantNode];
      const newEdges = [...edges, userEdge, assistantEdge];

      // Apply layout
      const layouted = getLayoutedNodesAndEdges(newNodes, newEdges);

      setNodes(layouted.nodes);
      setEdges(layouted.edges);

      setInputValue('');
      setCurrentNodeId(null);
    }
  };

  return (
    <div className="h-screen relative">
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          style={{ backgroundColor: '#fff' }}
        >
          <MiniMap />
          <Controls />
        </ReactFlow>
        {currentNodeId && (
          <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded shadow flex items-center z-10">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter your message"
              className="p-2 mr-2 border border-gray-300 rounded text-black placeholder:text-gray-600"
            />
            <button
              onClick={submitMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer hover:bg-blue-600"
            >
              Send
            </button>
          </div>
        )}
      </ReactFlowProvider>
    </div>
  );
};

export default Page;
