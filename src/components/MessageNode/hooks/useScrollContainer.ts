import { useEffect, useRef } from 'react';
import { ChatMessage } from '@/types/chat';

interface UseScrollContainerOptions {
  chatHistory: ChatMessage[];
}

/**
 * Custom hook that manages scroll behavior for the message container.
 * - Auto-scrolls to bottom when chat history changes
 * - Prevents wheel events from propagating when content is scrollable
 */
export const useScrollContainer = ({ chatHistory }: UseScrollContainerOptions) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when chat history changes
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }, [chatHistory]);

  // Prevent wheel event propagation when scrollable
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (container.scrollHeight > container.clientHeight) {
        e.stopPropagation();
      }
    };

    container.addEventListener('wheel', handleWheel);
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, []);

  return { containerRef };
};

export default useScrollContainer;

