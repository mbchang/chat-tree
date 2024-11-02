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
  isLeaf: boolean;
};

// MessageNode Component
const MessageNode = ({ data }: { data: MessageNodeData }) => {
  const { chatHistory, onSendMessage, onBranch, isLeaf } = data;
  const [inputValue, setInputValue] = useState('');

  // Function to handle sending messages
  const sendMessage = () => {
    if (inputValue.trim() !== '') {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  // Determine the index of the last message
  const lastMessageIndex = chatHistory.length - 1;

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
        {chatHistory.map((msg, index) => (
          <div key={msg.id} className="flex items-start">
            <div
              className={`p-2 rounded ${
                msg.sender === 'user' ? 'bg-gray-300' : 'bg-gray-200'
              } flex-1`}
            >
              {msg.content}
            </div>
            {msg.sender === 'assistant' &&
              // Hide "Branch" button for the last message of a leaf node
              !(isLeaf && index === lastMessageIndex) && (
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

      {/* Input Field - Only render if isLeaf is true */}
      {isLeaf && (
        <div className="mt-2">
          <div className="flex items-center">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter your message"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  sendMessage();
                }
              }}
              className="flex-1 p-2 border border-gray-300 rounded text-black placeholder:text-gray-600"
            />
            <button
              onClick={sendMessage}
              className="ml-2 text-blue-500 hover:text-blue-600"
              aria-label="Send message"
            >
              {/* Send Icon */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 512 512"
                className="h-5 w-5"
              >
                <path d="M440.6 273.4c4.7-4.5 7.4-10.8 7.4-17.4s-2.7-12.8-7.4-17.4l-176-168c-9.6-9.2-24.8-8.8-33.9 .8s-8.8 24.8 .8 33.9L364.1 232 24 232c-13.3 0-24 10.7-24 24s10.7 24 24 24l340.1 0L231.4 406.6c-9.6 9.2-9.9 24.3-.8 33.9s24.3 9.9 33.9 .8l176-168z" />
              </svg>
            </button>
          </div>
        </div>
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

const getLayoutedNodesAndEdges = (
  nodes: Node[],
  edges: Edge[],
  direction = 'TB' // Top to Bottom
) => {
  // Instantiate a new dagreGraph for each layout
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ rankdir: direction });

  // Constants for estimating node sizes
  const baseNodeHeight = 100; // Base height for a node (e.g., padding, input field)
  const messageHeight = 30; // Estimated height per message
  const nodeWidth = 500; // Width of nodes (can adjust as needed)

  nodes.forEach((node) => {
    const nodeData = node.data as MessageNodeData;
    const numMessages = nodeData.chatHistory.length;

    // Estimate the node height
    const estimatedHeight =
      baseNodeHeight + numMessages * messageHeight;

    dagreGraph.setNode(node.id, {
      width: nodeWidth,
      height: estimatedHeight + 3 * messageHeight,
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
      y:
        nodeWithPosition.y -
        (nodeWithPosition.height || baseNodeHeight) / 2,
    };
    // Optional: Set the node's style to match the estimated size
    node.style = {
      width: nodeWidth,
      height: nodeWithPosition.height,
    };
    return node;
  });

  return { nodes: layoutedNodes, edges };
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

      // Update isLeaf status
      const nodesWithIsLeaf = updateIsLeaf(
        layouted.nodes,
        layouted.edges
      );

      // Return updated flow data
      return {
        nodes: nodesWithIsLeaf,
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

      // Create new IDs
      const timestamp = Date.now();
      const branchNodeId = `${timestamp}-branch`;
      const continuationNodeId = `${timestamp}-continuation`;
      const newBranchNodeId = `${timestamp}-newbranch`;

      // Chat histories
      const chatHistoryUpToBranch = originalData.chatHistory.slice(
        0,
        messageIndex + 1
      );
      const chatHistoryAfterBranch = originalData.chatHistory.slice(
        messageIndex + 1
      );

      // Create new branch node (up to branch point)
      const branchNode: Node = {
        id: branchNodeId,
        type: 'messageNode',
        data: {
          chatHistory: chatHistoryUpToBranch,
          onSendMessage: (message) =>
            handleSendMessage(branchNodeId, message),
          onBranch: (msgId) => handleBranch(branchNodeId, msgId),
          isLeaf: true, // Will be updated later
        },
        position: originalNode.position,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
      };

      // Remove the original node and add the branch node
      const updatedNodes = [...nodes];
      updatedNodes[originalNodeIndex] = branchNode;

      // Adjust edges
      const updatedEdges = edges.map((edge) => {
        if (edge.target === nodeId) {
          // Edge points to original node; redirect it to the new branch node
          return { ...edge, target: branchNodeId };
        }
        return edge;
      });

      // Edges from branch node to continuation and new branch nodes
      const newEdges: Edge[] = [];

      // Create continuation node if there is remaining chat history
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
            isLeaf: true, // Will be updated later
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

        // Redirect edges originating from the original node to the continuation node
        edges.forEach((edge) => {
          if (edge.source === nodeId) {
            updatedEdges.push({
              ...edge,
              source: continuationNodeId,
            });
          }
        });
      } else {
        // No continuation; redirect edges originating from the original node to the branch node
        edges.forEach((edge) => {
          if (edge.source === nodeId) {
            updatedEdges.push({ ...edge, source: branchNodeId });
          }
        });
      }

      // Create new branch node (empty chat history)
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
          isLeaf: true,
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

      // Apply layout
      const layouted = getLayoutedNodesAndEdges(
        updatedNodes,
        allEdges
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
        isLeaf: true, // Initially, the root node is a leaf node
      },
      position: { x: 0, y: 0 },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
    };

    const layouted = getLayoutedNodesAndEdges([initialNode], []);

    // Update isLeaf status
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
          minZoom={0.01} // Adjusted minZoom
          translateExtent={[
            [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
            [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
          ]} // Optional: Allow infinite panning
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
