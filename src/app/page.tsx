// src/app/page.tsx

'use client';

import React, { useState, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  Position,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

type MessageNodeData = {
  message: string;
  sender: 'user' | 'assistant';
  onBranch: () => void;
};

const MessageNode = ({ data }: { data: MessageNodeData }) => {
  const { message, sender, onBranch } = data;
  return (
    <div
      style={{
        padding: 10,
        border: '1px solid black',
        borderRadius: 5,
        background: sender === 'user' ? '#e0f7fa' : '#e8eaf6',
      }}
    >
      <div>{message}</div>
      {sender === 'assistant' && (
        <button onClick={onBranch} style={{ marginTop: 5 }}>
          Branch
        </button>
      )}
    </div>
  );
};

const nodeTypes = {
  messageNode: MessageNode,
};

const Page = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const handleBranch = (nodeId: string) => {
    const message = prompt('Enter your message for the new branch:');
    if (message) {
      const timestamp = Date.now();
      const userNodeId = `${timestamp}-user`;
      const assistantNodeId = `${timestamp}-assistant`;

      const parentNode = nodes.find((n) => n.id === nodeId);

      const userNode: Node = {
        id: userNodeId,
        type: 'messageNode',
        data: {
          message,
          sender: 'user',
          onBranch: () => handleBranch(userNodeId),
        },
        position: {
          x: (parentNode?.position.x || 0) + 200,
          y: (parentNode?.position.y || 0) + 100,
        },
      };

      const assistantMessage = 'Assistant response to: ' + message;
      const assistantNode: Node = {
        id: assistantNodeId,
        type: 'messageNode',
        data: {
          message: assistantMessage,
          sender: 'assistant',
          onBranch: () => handleBranch(assistantNodeId),
        },
        position: {
          x: userNode.position.x,
          y: userNode.position.y + 100,
        },
      };

      const userEdge: Edge = {
        id: `e${nodeId}-${userNodeId}`,
        source: nodeId,
        target: userNodeId,
      };

      const assistantEdge: Edge = {
        id: `e${userNodeId}-${assistantNodeId}`,
        source: userNodeId,
        target: assistantNodeId,
      };

      setNodes((nds) => nds.concat([userNode, assistantNode]));
      setEdges((eds) => eds.concat([userEdge, assistantEdge]));
    }
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
      position: { x: 250, y: 5 },
    };

    setNodes([initialNode]);
  }, []);

  return (
    <div style={{ height: '100vh' }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default Page;
