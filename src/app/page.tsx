'use client';

import React, {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  Viewport,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';
import MessageNode from '../components/MessageNode';
import TreeEdge from '../components/TreeEdge';
import { useFlow } from '@/hooks/useFlow';
import { nodeWidth } from '@/constants/layout';

// Store the last stable viewport before any node changes
let savedViewport: Viewport = { x: 0, y: 0, zoom: 1 };

// Inner component that uses useFlow and has access to ReactFlow context
const FlowCanvas: React.FC<{ isDebugMode: boolean }> = ({
  isDebugMode,
}) => {
  const { flowData, activeNodeId } = useFlow(isDebugMode);
  const { fitView, getViewport, setViewport, getNodes } =
    useReactFlow();

  const hasInitialized = useRef(false);
  const prevActiveNodeId = useRef<string | null>(null);
  const prevNodesLength = useRef(0);

  const nodeTypes = useMemo(
    () => ({
      messageNode: MessageNode,
    }),
    []
  );

  const edgeTypes = useMemo(
    () => ({
      tree: TreeEdge,
    }),
    []
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'tree',
      style: { stroke: '#cbd5e1', strokeWidth: 2 },
    }),
    []
  );

  // Save viewport whenever nodes haven't changed (stable state)
  useEffect(() => {
    if (
      hasInitialized.current &&
      flowData.nodes.length === prevNodesLength.current
    ) {
      savedViewport = getViewport();
    }
    prevNodesLength.current = flowData.nodes.length;
  }, [flowData.nodes, getViewport]);

  // Initial fit view
  useEffect(() => {
    if (!hasInitialized.current && flowData.nodes.length > 0) {
      hasInitialized.current = true;
      setTimeout(() => {
        fitView({ padding: 0.2, duration: 0 });
        savedViewport = getViewport();
      }, 50);
      prevActiveNodeId.current = activeNodeId;
    }
  }, [flowData.nodes, fitView, activeNodeId, getViewport]);

  // Reusable animation function
  const animateToNode = useCallback(
    (nodeId: string, useSavedViewport = false) => {
      // Use getNodes() to ensure we have the latest registered nodes with up-to-date positions
      const currentNodes = getNodes();
      const node = currentNodes.find((n) => n.id === nodeId);

      if (node && node.position) {
        const nodeHeight =
          typeof node.style?.height === 'number'
            ? node.style.height
            : 150;

        // Calculate target center position
        const targetX = node.position.x + nodeWidth / 2;
        const targetY = node.position.y + nodeHeight / 2;

        // Get canvas dimensions
        const canvasWidth = window.innerWidth;
        const canvasHeight = window.innerHeight;

        // Determine starting viewport
        const currentViewport = getViewport();
        const startViewport = useSavedViewport
          ? { ...savedViewport }
          : currentViewport;

        const targetZoom = Math.max(startViewport.zoom, 0.8);

        // Calculate target viewport to center the node
        const endViewport = {
          x: canvasWidth / 2 - targetX * targetZoom,
          y: canvasHeight / 2 - targetY * targetZoom,
          zoom: targetZoom,
        };

        // If using saved viewport, restore immediately first
        if (useSavedViewport) {
          setViewport(startViewport, { duration: 0 });
        }

        // Then animate to target
        const duration = 400;
        const startTime = performance.now();

        const animate = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);

          // Ease-out cubic for smooth deceleration
          const eased = 1 - Math.pow(1 - progress, 3);

          setViewport(
            {
              x:
                startViewport.x +
                (endViewport.x - startViewport.x) * eased,
              y:
                startViewport.y +
                (endViewport.y - startViewport.y) * eased,
              zoom:
                startViewport.zoom +
                (endViewport.zoom - startViewport.zoom) * eased,
            },
            { duration: 0 }
          );

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        requestAnimationFrame(animate);
      }
    },
    [getNodes, getViewport, setViewport]
  );

  // Handle zoom to active node when it changes
  useEffect(() => {
    if (!hasInitialized.current) return;

    if (activeNodeId && activeNodeId !== prevActiveNodeId.current) {
      // Use saved viewport for auto-zoom to prevent jump
      animateToNode(activeNodeId, true);
      prevActiveNodeId.current = activeNodeId;
    }
  }, [activeNodeId, animateToNode]);

  return (
    <ReactFlow
      nodes={flowData.nodes}
      edges={flowData.edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      defaultEdgeOptions={defaultEdgeOptions}
      minZoom={0.01}
      translateExtent={[
        [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
        [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
      ]}
      style={{ backgroundColor: 'transparent' }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1}
        color="rgba(148, 163, 184, 0.3)"
      />
      <MiniMap
        nodeColor={() => '#3b82f6'}
        maskColor="rgba(241, 245, 249, 0.8)"
        style={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '12px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
        }}
      />
      <Controls
        style={{
          borderRadius: '12px',
          border: '1px solid rgba(226, 232, 240, 0.8)',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}
      />
      <Panel position="top-left" className="z-50 ml-2 mt-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            const nodes = getNodes();
            const rootNode = nodes.find((n) => n.data.isRoot);
            if (rootNode) {
              animateToNode(rootNode.id, false);
            }
          }}
          className="group flex items-center space-x-2 bg-white/90 backdrop-blur-sm hover:bg-blue-50 text-slate-600 hover:text-blue-600 font-medium py-2 px-4 rounded-full shadow-sm hover:shadow-md border border-slate-200/60 transition-all duration-200"
          title="Go back to the start of the conversation"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <span className="text-sm">Back to Start</span>
        </button>
      </Panel>
    </ReactFlow>
  );
};

const Page = () => {
  const [isDebugMode, setIsDebugMode] = useState(
    process.env.NODE_ENV === 'development'
  );

  return (
    <div className="h-screen relative bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200">
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setIsDebugMode((prev) => !prev)}
            className="px-4 py-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl backdrop-blur-sm text-sm font-medium"
          >
            {isDebugMode ? '🐛 Debug Mode' : '🚀 Production Mode'}
          </button>
        </div>
      )}

      {/* Header Card */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-10 max-w-2xl w-full px-4">
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-slate-200/50 px-6 py-4">
          <p className="text-slate-600 text-center text-sm leading-relaxed">
            Ever wanted to ask multiple independent follow-up
            questions without polluting the context or scrolling up
            and down through the chat history?
          </p>
          <p className="text-slate-500 text-center text-sm mt-2">
            Click the{' '}
            <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-100 rounded-md mx-1">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 text-emerald-600"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-label="Branch Icon"
              >
                <path d="M10 3a1 1 0 100 2h4.586L9.293 10.293a1 1 0 001.414 1.414L16 6.414V11a1 1 0 102 0V4a1 1 0 00-1-1h-7z" />
              </svg>
            </span>{' '}
            icon to fork the conversation from a previous message.
          </p>
        </div>
      </div>

      <ReactFlowProvider>
        <FlowCanvas isDebugMode={isDebugMode} />
      </ReactFlowProvider>
    </div>
  );
};

export default Page;
