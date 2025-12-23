import React from 'react';
import { EdgeProps } from 'reactflow';

// Fixed vertical drop from parent before horizontal routing
const JUNCTION_OFFSET = 80;

/**
 * Custom tree edge that creates clean, non-overlapping paths.
 * Draws: parent → down → horizontal → down → child
 *
 * Uses a fixed offset from the parent so all sibling edges share
 * the same horizontal junction level.
 */
const TreeEdge: React.FC<EdgeProps> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
}) => {
  // Fixed junction Y - same for all edges from the same parent
  // This ensures horizontal segments align across siblings
  const junctionY = sourceY + JUNCTION_OFFSET;

  // Create the path: down from source, horizontal to target X, down to target
  const path = `
    M ${sourceX} ${sourceY}
    L ${sourceX} ${junctionY}
    L ${targetX} ${junctionY}
    L ${targetX} ${targetY}
  `;

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path"
        d={path}
        style={{
          ...style,
          fill: 'none',
        }}
        markerEnd={markerEnd}
      />
      {/* Invisible wider path for better interaction */}
      <path
        d={path}
        style={{
          fill: 'none',
          stroke: 'transparent',
          strokeWidth: 20,
        }}
      />
    </>
  );
};

export default TreeEdge;

