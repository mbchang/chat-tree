import { useState, useEffect, useRef, useCallback } from 'react';
import { Node, Edge, Position } from 'reactflow';
import { MessageNodeData, ChatMessage, TreeEdgeData } from '@/types/chat';
import {
  getLayoutedNodesAndEdges,
  updateIsLeaf,
  getDescendants,
  mergeNodes,
} from '@/utils/layout';
import { getAIService, AIServiceInterface } from '@/services/ai';

/**
 * Computes the path (edge IDs) from root to a given node
 */
const getPathToNode = (
  nodeId: string,
  edges: Edge[]
): Set<string> => {
  const pathEdgeIds = new Set<string>();
  let currentNodeId = nodeId;

  while (currentNodeId) {
    const parentEdge = edges.find((edge) => edge.target === currentNodeId);
    if (parentEdge) {
      pathEdgeIds.add(parentEdge.id);
      currentNodeId = parentEdge.source;
    } else {
      break; // Reached root
    }
  }

  return pathEdgeIds;
};

/**
 * Computes the path (node IDs) from root to a given node
 */
const getNodePathToNode = (
  nodeId: string,
  edges: Edge[]
): Set<string> => {
  const pathNodeIds = new Set<string>();
  pathNodeIds.add(nodeId);
  let currentNodeId = nodeId;

  while (currentNodeId) {
    const parentEdge = edges.find((edge) => edge.target === currentNodeId);
    if (parentEdge) {
      pathNodeIds.add(parentEdge.source);
      currentNodeId = parentEdge.source;
    } else {
      break; // Reached root
    }
  }

  return pathNodeIds;
};

export const useFlow = (isDebugMode: boolean = true) => {
  const [flowData, setFlowData] = useState<{
    nodes: Node<MessageNodeData>[];
    edges: Edge<TreeEdgeData>[];
  }>({
    nodes: [],
    edges: [],
  });

  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

  // Ref to hold the current isDebugMode value
  const isDebugModeRef = useRef(isDebugMode);

  // Update the ref whenever isDebugMode changes
  useEffect(() => {
    isDebugModeRef.current = isDebugMode;
  }, [isDebugMode]);

  // Initialize AIService based on the current mode
  const aiServiceRef = useRef<AIServiceInterface>(
    getAIService(isDebugMode)
  );

  useEffect(() => {
    aiServiceRef.current = getAIService(isDebugMode);
  }, [isDebugMode]);

  // Ref to track the node currently awaiting an assistant response
  const awaitingResponseRef = useRef<string | null>(null);

  // Handle setting the active node
  const handleSetActive = useCallback((nodeId: string) => {
    setActiveNodeId(nodeId);
  }, []);

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
      const updatedNodes = nodes.filter(
        (node) => !nodesToDelete.includes(node.id)
      );
      const updatedEdges = edges.filter(
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

  const handleSendMessage = useCallback(
    async (nodeId: string, message: string) => {
      const timestamp = Date.now();
      const userMessage: ChatMessage = {
        id: `msg-${timestamp}-user`,
        sender: 'user',
        content: message,
      };

      // Add user message to the node's chat history and set isLoading to true
      setFlowData((prevFlowData) => {
        const { nodes, edges } = prevFlowData;
        const updatedNodes = nodes.map((node) => {
          if (node.id === nodeId) {
            const nodeData = node.data as MessageNodeData;
            return {
              ...node,
              data: {
                ...nodeData,
                chatHistory: [...nodeData.chatHistory, userMessage],
                isLoading: true, // Set loading state
              },
            };
          }
          return node;
        });

        const layouted = getLayoutedNodesAndEdges(
          updatedNodes,
          edges
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

      // Set the nodeId in ref to indicate it's awaiting a response
      awaitingResponseRef.current = nodeId;
    },
    []
  );

  useEffect(
    () => {
      if (!awaitingResponseRef.current) return;

      const nodeId = awaitingResponseRef.current;

      // Fetch AI response with apiKey
      aiServiceRef.current
        .getResponse(
          getFullChatHistory(nodeId, flowData.nodes, flowData.edges)
        )
        .then((assistantMessage) => {
          // Update the node's chat history with the assistant's response and set isLoading to false
          setFlowData((prevFlowData) => {
            const { nodes, edges } = prevFlowData;
            const updatedNodes = nodes.map((node) => {
              if (node.id === nodeId) {
                const nodeData = node.data as MessageNodeData;
                return {
                  ...node,
                  data: {
                    ...nodeData,
                    chatHistory: [
                      ...nodeData.chatHistory,
                      assistantMessage,
                    ],
                    isLoading: false, // Reset loading state
                  },
                };
              }
              return node;
            });

            const layouted = getLayoutedNodesAndEdges(
              updatedNodes,
              edges
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

          // Reset the awaiting response ref
          awaitingResponseRef.current = null;
        })
        .catch((error) => {
          console.error('Error fetching assistant response:', error);
          // Optionally, handle errors by notifying the user or retrying

          // Reset loading state even on error
          setFlowData((prevFlowData) => {
            const { nodes, edges } = prevFlowData;
            const updatedNodes = nodes.map((node) => {
              if (node.id === nodeId) {
                const nodeData = node.data as MessageNodeData;
                return {
                  ...node,
                  data: {
                    ...nodeData,
                    isLoading: false, // Reset loading state
                  },
                };
              }
              return node;
            });

            return {
              nodes: updatedNodes,
              edges: edges,
            };
          });

          awaitingResponseRef.current = null;
        });
    },
    [flowData.nodes, flowData.edges] // Removed apiKey from dependencies
  );

  // Ref to track which node to zoom to after branch creation
  const pendingZoomNodeRef = useRef<string | null>(null);

  const handleBranch = (nodeId: string, messageId: string) => {
    const timestamp = Date.now();
    const newBranchNodeId = `${timestamp}-newbranch`;

    // Store the ID to zoom to after state updates
    pendingZoomNodeRef.current = newBranchNodeId;

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

      const branchNodeId = `${timestamp}-branch`;
      const continuationNodeId = `${timestamp}-continuation`;

      const chatHistoryUpToBranch = originalData.chatHistory.slice(
        0,
        messageIndex + 1
      );
      const chatHistoryAfterBranch = originalData.chatHistory.slice(
        messageIndex + 1
      );

      const branchNode: Node<MessageNodeData> = {
        id: branchNodeId,
        type: 'messageNode',
        data: {
          chatHistory: chatHistoryUpToBranch,
          onSendMessage: (message: string) =>
            handleSendMessage(branchNodeId, message),
          onBranch: (msgId: string) =>
            handleBranch(branchNodeId, msgId),
          onDelete: handleDelete,
          onSetActive: handleSetActive,
          isLeaf: true,
          isRoot: originalData.isRoot,
          isLoading: false,
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
        const continuationNode: Node<MessageNodeData> = {
          id: continuationNodeId,
          type: 'messageNode',
          data: {
            chatHistory: chatHistoryAfterBranch,
            onSendMessage: (message: string) =>
              handleSendMessage(continuationNodeId, message),
            onBranch: (msgId: string) =>
              handleBranch(continuationNodeId, msgId),
            onDelete: handleDelete,
            onSetActive: handleSetActive,
            isLeaf: true,
            isRoot: false,
            isLoading: false,
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
          type: 'tree',
          animated: true,
          style: { stroke: '#555', strokeWidth: 2 },
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

      const newBranchNode: Node<MessageNodeData> = {
        id: newBranchNodeId,
        type: 'messageNode',
        data: {
          chatHistory: [],
          onSendMessage: (message: string) =>
            handleSendMessage(newBranchNodeId, message),
          onBranch: (msgId: string) =>
            handleBranch(newBranchNodeId, msgId),
          onDelete: handleDelete,
          onSetActive: handleSetActive,
          isLeaf: true,
          isRoot: false,
          isLoading: false,
        },
        position: {
          x: branchNode.position.x + 300 * branchOutEdges.length,
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
        type: 'tree',
        animated: true,
        style: { stroke: '#555', strokeWidth: 2 },
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

    // Set active node after the state update is queued
    // Use setTimeout to ensure it happens after React processes the state update
    setTimeout(() => {
      if (pendingZoomNodeRef.current) {
        setActiveNodeId(pendingZoomNodeRef.current);
        pendingZoomNodeRef.current = null;
      }
    }, 50);
  };

  useEffect(() => {
    const initialNode: Node<MessageNodeData> = {
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
        onSendMessage: (message: string) =>
          handleSendMessage('1', message),
        onBranch: (messageId: string) => handleBranch('1', messageId),
        onDelete: handleDelete,
        onSetActive: handleSetActive,
        isLeaf: true,
        isRoot: true,
        isLoading: false,
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

    // Set the initial node as active
    setActiveNodeId('1');
  }, []); // No dependencies here to run only once

  // Compute flow data with active path highlighting
  const flowDataWithActivePath = useCallback(() => {
    if (!activeNodeId) {
      return flowData;
    }

    const activeEdgeIds = getPathToNode(activeNodeId, flowData.edges);
    const activeNodeIds = getNodePathToNode(activeNodeId, flowData.edges);

    const edgesWithActive = flowData.edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        isActive: activeEdgeIds.has(edge.id),
      },
    }));

    const nodesWithActive = flowData.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isOnActivePath: activeNodeIds.has(node.id),
      },
    }));

    return {
      nodes: nodesWithActive,
      edges: edgesWithActive,
    };
  }, [flowData, activeNodeId]);

  return {
    flowData: flowDataWithActivePath(),
    handleDelete,
    handleSendMessage,
    handleBranch,
    activeNodeId,
  };
};

const getFullChatHistory = (
  nodeId: string,
  nodes: Node<MessageNodeData>[],
  edges: Edge[]
): ChatMessage[] => {
  const history: ChatMessage[] = [];
  let currentNodeId = nodeId;

  while (currentNodeId) {
    const currentNode = nodes.find(
      (node) => node.id === currentNodeId
    );
    if (!currentNode) break;

    const nodeData = currentNode.data as MessageNodeData;
    history.unshift(...nodeData.chatHistory); // Prepend to maintain chronological order

    const parentEdge = edges.find(
      (edge) => edge.target === currentNodeId
    );
    if (parentEdge) {
      currentNodeId = parentEdge.source;
    } else {
      break; // Reached the root node
    }
  }

  return history;
};
