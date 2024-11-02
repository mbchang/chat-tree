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
import ReactMarkdown from 'react-markdown';

type ChatMessage = {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
};

type MessageNodeData = {
  chatHistory: ChatMessage[];
  onSendMessage: (message: string) => void;
  onBranch: (messageId: string) => void;
  onDelete: (nodeId: string) => void; // Add this line
  isLeaf: boolean;
};

// MessageNode Component

const MessageNode = ({
  data,
  id,
}: {
  data: MessageNodeData;
  id: string;
}) => {
  const { chatHistory, onSendMessage, onBranch, isLeaf, onDelete } =
    data;
  const [inputValue, setInputValue] = useState('');
  const [isHoveringDelete, setIsHoveringDelete] = useState(false);

  const sendMessage = () => {
    const trimmedInput = inputValue.trim();
    if (trimmedInput !== '') {
      onSendMessage(trimmedInput);
      setInputValue('');
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevents newline
      sendMessage(); // Sends the message
    }
  };

  const lastMessageIndex = chatHistory.length - 1;

  return (
    <div className="p-4 border border-gray-300 rounded bg-white text-black relative w-[600px]">
      {/* Delete Button */}
      <div
        className="absolute -top-2 -right-2 z-10 cursor-pointer transition-opacity duration-200"
        style={{ opacity: isHoveringDelete ? '1' : '0.3' }}
        onMouseEnter={() => setIsHoveringDelete(true)}
        onMouseLeave={() => setIsHoveringDelete(false)}
        onClick={() => onDelete(id)}
      >
        <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </div>
      </div>

      {/* Messages */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ top: -8, background: '#555' }}
      />
      <div className="flex flex-col space-y-2 mb-2">
        {chatHistory.map((msg, index) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`p-2 rounded-lg max-w-[80%] ${
                msg.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-black'
              }`}
            >
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            </div>
            {msg.sender === 'assistant' &&
              !(isLeaf && index === lastMessageIndex) && (
                <button
                  onClick={() => onBranch(msg.id)}
                  className="ml-2 text-gray-400 hover:text-green-500 transition-colors duration-200"
                  style={{ fontSize: '12px', padding: '2px' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 3a1 1 0 100 2h4.586L9.293 10.293a1 1 0 001.414 1.414L16 6.414V11a1 1 0 102 0V4a1 1 0 00-1-1h-7z" />
                  </svg>
                </button>
              )}
          </div>
        ))}
      </div>

      {/* Input area */}
      {isLeaf && (
        <div className="mt-2">
          <div className="flex items-center">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter your message"
              onKeyDown={handleKeyDown}
              className="flex-1 p-2 border border-gray-300 rounded text-black placeholder:text-gray-600 resize-none"
              rows={2}
            />
            <button
              onClick={sendMessage}
              className="ml-2 text-blue-500 hover:text-blue-600"
              aria-label="Send message"
            >
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
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  // Increase vertical spacing between nodes
  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 100, // Horizontal spacing between nodes
    ranksep: 200, // Vertical spacing between ranks
    rankwidth: 1000, // Width available for each rank
  });

  // Constants for node sizing
  const baseNodeHeight = 100;
  const messageHeight = 40; // Increased from 30 to give more space
  const nodeWidth = 600; // Increased from 500
  const minHeight = 150; // Minimum height for nodes

  // Calculate node dimensions
  nodes.forEach((node) => {
    const nodeData = node.data as MessageNodeData;
    const numMessages = nodeData.chatHistory.length;

    // Calculate height with padding and minimum size
    const estimatedHeight = Math.max(
      minHeight,
      baseNodeHeight + numMessages * messageHeight
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
    const processedPairs = new Set<string>(); // Track already processed node pairs

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

      // Check each node
      for (const [nodeId, children] of nodeChildCount.entries()) {
        if (children.length === 1) {
          const childId = children[0];
          const pairKey = `${nodeId}-${childId}`;

          // Skip if this pair was already processed
          if (processedPairs.has(pairKey)) continue;

          const parentNode = mergedNodes.find((n) => n.id === nodeId);
          const childNode = mergedNodes.find((n) => n.id === childId);

          if (parentNode && childNode) {
            // Only merge if child has exactly one parent
            const childParents = nodeParentCount.get(childId) || [];
            if (childParents.length === 1) {
              // Check for circular references
              const childDescendants = getDescendants(
                childId,
                mergedEdges
              );
              if (childDescendants.includes(nodeId)) continue;

              // Merge the nodes
              const mergedNode: Node = {
                ...parentNode,
                data: {
                  ...parentNode.data,
                  chatHistory: [
                    ...(parentNode.data as MessageNodeData)
                      .chatHistory,
                    ...(childNode.data as MessageNodeData)
                      .chatHistory,
                  ],
                  isLeaf: (childNode.data as MessageNodeData).isLeaf,
                },
              };

              // Update nodes array
              mergedNodes = mergedNodes.filter(
                (n) => n.id !== nodeId && n.id !== childId
              );
              mergedNodes.push(mergedNode);

              // Update edges
              mergedEdges = mergedEdges.filter(
                (e) => e.source !== nodeId && e.target !== childId
              );

              // Redirect child's outgoing edges to merged node
              const childOutgoingEdges = edges.filter(
                (e) => e.source === childId
              );
              childOutgoingEdges.forEach((edge) => {
                mergedEdges.push({
                  ...edge,
                  source: nodeId,
                });
              });

              processedPairs.add(pairKey);
              merged = true;
              break;
            }
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
