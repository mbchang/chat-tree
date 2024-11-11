'use client';

import React, {
  useMemo,
  useState,
  useContext,
  useEffect,
} from 'react';
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';
import MessageNode from '../components/MessageNode';
import { useFlow } from '@/hooks/useFlow';
import { ApiKeyContext } from '@/context/ApiKeyContext';

const Page = () => {
  const { apiKey, setApiKey } = useContext(ApiKeyContext);
  const [isDebugMode, setIsDebugMode] = useState(
    process.env.NODE_ENV === 'development'
  );
  const { flowData } = useFlow(isDebugMode);

  // Debugging: Log apiKey changes
  useEffect(() => {}, [apiKey]);

  // Debugging: Log isDebugMode changes
  useEffect(() => {
    console.log('Page Component - isDebugMode:', isDebugMode);
  }, [isDebugMode]);

  const nodeTypes = useMemo(
    () => ({
      messageNode: MessageNode,
    }),
    []
  );

  const handleApiKeyChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setApiKey(e.target.value);
  };

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

      <div className="absolute top-4 left-4 z-10">
        <input
          type="password"
          value={apiKey}
          onChange={handleApiKeyChange}
          placeholder="Enter OpenAI API Key"
          className="px-4 py-2 border border-gray-300 rounded-md bg-white text-black placeholder:text-gray-500"
        />
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
