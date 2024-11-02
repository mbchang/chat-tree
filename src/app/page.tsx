// src/app/page.tsx

'use client';

import React, { useState } from 'react';
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
        border: '1px solid #ccc',
        borderRadius: 5,
        background: sender === 'user' ? '#d9d9d9' : '#e6e6e6',
        color: '#000',
        maxWidth: 200,
        position: 'relative',
      }}
    >
      {/* Target Handle */}
      <Handle
        type="target"
        position={Position.Left}
        style={{ top: '50%', background: '#555' }}
      />
      <div>{message}</div>
      {sender === 'assistant' && (
        <button
          onClick={onBranch}
          style={{
            marginTop: 5,
            padding: '5px 10px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            borderRadius: 3,
            cursor: 'pointer',
          }}
        >
          Branch
        </button>
      )}
      {/* Source Handle */}
      <Handle
        type="source"
        position={Position.Right}
        style={{ top: '50%', background: '#555' }}
      />
    </div>
  );
};

const nodeTypes = {
  messageNode: MessageNode,
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

  // Initialize the initial node after handleBranch is defined
  React.useEffect(() => {
    const initialNode: Node = {
      id: '1',
      type: 'messageNode',
      data: {
        message: 'Hello! How can I assist you today?',
        sender: 'assistant',
        onBranch: () => handleBranch('1'),
      },
      position: { x: 250, y: 5 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    };
    setNodes([initialNode]);
  }, []);

  const submitMessage = () => {
    if (inputValue && currentNodeId) {
      const timestamp = Date.now();
      const userNodeId = `${timestamp}-user`;
      const assistantNodeId = `${timestamp}-assistant`;

      const parentNode = nodes.find((n) => n.id === currentNodeId);

      const userNode: Node = {
        id: userNodeId,
        type: 'messageNode',
        data: {
          message: inputValue,
          sender: 'user',
          onBranch: () => handleBranch(userNodeId),
        },
        position: {
          x: (parentNode?.position.x || 0) + 200,
          y: (parentNode?.position.y || 0) + 100,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
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
        position: {
          x: userNode.position.x,
          y: userNode.position.y + 100,
        },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
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

      setNodes((nds) => nds.concat([userNode, assistantNode]));
      setEdges((eds) => eds.concat([userEdge, assistantEdge]));

      setInputValue('');
      setCurrentNodeId(null);
    }
  };

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
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
          <div
            style={{
              position: 'absolute',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#fff',
              padding: 10,
              borderRadius: 5,
              boxShadow: '0 0 10px rgba(0,0,0,0.1)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter your message"
              style={{
                padding: 5,
                marginRight: 10,
                border: '1px solid #ccc',
                borderRadius: 3,
              }}
            />
            <button
              onClick={submitMessage}
              style={{
                padding: '5px 10px',
                backgroundColor: '#007bff',
                color: '#fff',
                border: 'none',
                borderRadius: 3,
                cursor: 'pointer',
              }}
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
