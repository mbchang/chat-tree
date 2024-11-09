'use client';

import React, { useMemo, useState } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';
import MessageNode from '../components/MessageNode';
import { useFlow } from '@/hooks/useFlow';

const Page = () => {
  const [isDebugMode, setIsDebugMode] = useState(true);
  const { flowData } = useFlow(isDebugMode);

  const nodeTypes = useMemo(
    () => ({
      messageNode: MessageNode,
    }),
    []
  );

  return (
    <div className="h-screen relative">
      <div className="absolute top-4 right-4 z-10">
        <button
          onClick={() => setIsDebugMode((prev) => !prev)}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors shadow-md"
        >
          {isDebugMode ? '🐛 Debug Mode' : '🚀 Production Mode'}
        </button>
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
