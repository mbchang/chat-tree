'use client';

import React, { useMemo, useState, useEffect } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';
import MessageNode from '../components/MessageNode';
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

  return (
    <div className="h-screen relative">
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => setIsDebugMode((prev) => !prev)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors shadow-md"
          >
            {isDebugMode ? '🐛 Debug Mode' : '🚀 Production Mode'}
          </button>
        </div>
      )}

      <div className="absolute top-20 left-4 right-4 z-10 text-gray-700 text-center space-y-2">
        <p>
          Ever wanted to ask multiple independent follow-up questions
          without polluting the context or scrolling up and down
          through the chat history?
        </p>
        <p>
          Click the{' '}
          <span className="inline-flex items-center justify-center w-5 h-5">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 text-gray-700"
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
