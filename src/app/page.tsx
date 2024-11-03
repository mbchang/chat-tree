'use client';

import React from 'react';
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';
import MessageNode from '../components/MessageNode';
import { useFlow } from '@/hooks/useFlow';

const nodeTypes = {
  messageNode: MessageNode,
};

const Page = () => {
  const { flowData } = useFlow();

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
