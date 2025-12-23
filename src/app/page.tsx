'use client';

import React, { useMemo, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
} from 'reactflow';
import 'reactflow/dist/style.css';
import MessageNode from '../components/MessageNode';
import TreeEdge from '../components/TreeEdge';
import { useFlow } from '@/hooks/useFlow';

const Page = () => {
  const [isDebugMode, setIsDebugMode] = useState(
    process.env.NODE_ENV === 'development'
  );
  const { flowData } = useFlow(isDebugMode);

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
            Ever wanted to ask multiple independent follow-up questions
            without polluting the context or scrolling up and down
            through the chat history?
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
        <ReactFlow
          nodes={flowData.nodes}
          edges={flowData.edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
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
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default Page;
