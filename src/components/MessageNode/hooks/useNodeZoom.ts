import { useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { ZOOM_ANIMATION, NODE_WIDTH } from '../constants';

interface UseNodeZoomOptions {
  nodeId: string;
}

/**
 * Custom hook that handles animated zoom-to-center behavior when clicking on a node.
 * Uses eased animation for smooth transitions.
 */
export const useNodeZoom = ({ nodeId }: UseNodeZoomOptions) => {
  const { getNodes, setCenter, getZoom } = useReactFlow();

  const zoomToNode = useCallback(
    (event: React.MouseEvent) => {
      // Don't zoom if user is selecting text
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        return;
      }

      // Don't zoom if clicking on interactive elements
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.closest('.interactive-element')
      ) {
        return;
      }

      const node = getNodes().find((n) => n.id === nodeId);
      if (!node) return;

      const height = node.style?.height;
      const nodeHeight =
        typeof height === 'string'
          ? parseFloat(height)
          : typeof height === 'number'
          ? height
          : 0;

      const currentZoom = getZoom();
      const { targetZoom, steps, stepDuration, transitionDuration } =
        ZOOM_ANIMATION;

      let step = 0;
      const interval = setInterval(() => {
        if (step >= steps) {
          clearInterval(interval);
          return;
        }

        const progress = step / steps;
        // Ease-in-out quadratic easing
        const easeProgress =
          progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        const intermediateZoom =
          currentZoom + (targetZoom - currentZoom) * easeProgress;

        setCenter(node.position.x + NODE_WIDTH / 2, node.position.y + nodeHeight / 2, {
          zoom: intermediateZoom,
          duration: transitionDuration,
        });

        step++;
      }, stepDuration);
    },
    [getNodes, getZoom, setCenter, nodeId]
  );

  return { zoomToNode };
};

export default useNodeZoom;

