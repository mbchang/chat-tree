import React from 'react';
import { EdgeProps } from 'reactflow';
import { TreeEdgeData } from '@/types/chat';

// Fixed vertical drop from parent before horizontal routing
const JUNCTION_OFFSET = 80;
// Radius for rounded corners
const CORNER_RADIUS = 16;

// Colors for active/inactive states
const ACTIVE_COLOR = '#3b82f6'; // blue-500
const INACTIVE_COLOR = '#d1d5db'; // gray-300

/**
 * Custom tree edge that creates clean, non-overlapping paths with rounded corners.
 * Draws: parent → down → rounded corner → horizontal → rounded corner → down → child
 *
 * Uses a fixed offset from the parent so all sibling edges share
 * the same horizontal junction level.
 */
const TreeEdge: React.FC<EdgeProps<TreeEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  data,
}) => {
  const isActive = data?.isActive ?? false;
  // Fixed junction Y - same for all edges from the same parent
  const junctionY = sourceY + JUNCTION_OFFSET;

  // Determine direction
  const goingRight = targetX > sourceX;
  const isStraight = targetX === sourceX;

  // Clamp radius to avoid issues with short distances
  const horizontalDistance = Math.abs(targetX - sourceX);
  const verticalDistanceTop = JUNCTION_OFFSET;
  const verticalDistanceBottom = targetY - junctionY;

  const effectiveRadius = Math.min(
    CORNER_RADIUS,
    horizontalDistance / 2,
    verticalDistanceTop / 2,
    verticalDistanceBottom / 2
  );

  let path: string;

  if (isStraight) {
    // Straight line down - no corners needed
    path = `M ${sourceX} ${sourceY} L ${sourceX} ${targetY}`;
  } else {
    // Direction multiplier: 1 for right, -1 for left
    const dir = goingRight ? 1 : -1;

    // Build path with rounded corners
    path = `
      M ${sourceX} ${sourceY}
      L ${sourceX} ${junctionY - effectiveRadius}
      Q ${sourceX} ${junctionY} ${
      sourceX + dir * effectiveRadius
    } ${junctionY}
      L ${targetX - dir * effectiveRadius} ${junctionY}
      Q ${targetX} ${junctionY} ${targetX} ${
      junctionY + effectiveRadius
    }
      L ${targetX} ${targetY}
    `;
  }

  const edgeColor = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;
  const strokeWidth = isActive ? 3 : 2;

  // Calculate approximate path length for draw-in animation
  const pathLength =
    JUNCTION_OFFSET +
    horizontalDistance +
    Math.max(0, targetY - junctionY);

  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path edge-enter"
        d={path}
        style={
          {
            ...style,
            stroke: edgeColor,
            strokeWidth,
            fill: 'none',
            transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
            strokeDasharray: pathLength,
            ['--path-length' as string]: pathLength,
          } as React.CSSProperties
        }
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
