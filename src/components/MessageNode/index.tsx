import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';
import MessageContent from '../MessageContent';
import { maxNodeHeight } from '@/constants/layout';
import { MessageNodeData } from '@/types/chat';

// MessageNode Component
const MessageNode = ({
  data,
  id,
}: {
  data: MessageNodeData;
  id: string;
}) => {
  const {
    chatHistory,
    onSendMessage,
    onBranch,
    isLeaf,
    onDelete,
    isRoot,
  } = data;
  const [inputValue, setInputValue] = useState('');
  const [isHoveringDelete, setIsHoveringDelete] = useState(false);
  const { getNodes, setCenter, getZoom } = useReactFlow();
  const messageContainerRef = useRef<HTMLDivElement>(null);

  const handleNodeClick = (event: React.MouseEvent) => {
    if (
      (event.target as HTMLElement).tagName === 'BUTTON' ||
      (event.target as HTMLElement).tagName === 'INPUT' ||
      (event.target as HTMLElement).closest('.interactive-element')
    ) {
      return;
    }

    const node = getNodes().find((n) => n.id === id);
    if (!node) return;

    // Get the node's dimensions
    const nodeHeight = (node.style?.height as number) || 0;

    const currentZoom = getZoom();
    const targetZoom = 1.5;
    const steps = 20;

    let step = 0;
    const interval = setInterval(() => {
      if (step >= steps) {
        clearInterval(interval);
        return;
      }

      const progress = step / steps;
      const easeProgress =
        progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const intermediateZoom =
        currentZoom + (targetZoom - currentZoom) * easeProgress;

      // Center on the bottom of the node by adding half the node height
      setCenter(
        node.position.x + 300, // Center horizontally
        node.position.y + nodeHeight / 2, // Position at bottom of node
        {
          zoom: intermediateZoom,
          duration: 50,
        }
      );

      step++;
    }, 20);
  };

  const sendMessage = () => {
    const trimmedInput = inputValue.trim();
    if (trimmedInput !== '') {
      onSendMessage(trimmedInput);
      setInputValue('');
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    const messageContainer = messageContainerRef.current;
    if (messageContainer) {
      const handleWheel = (e: WheelEvent) => {
        if (
          messageContainer.scrollHeight >
          messageContainer.clientHeight
        ) {
          e.stopPropagation();
        }
      };
      messageContainer.addEventListener('wheel', handleWheel);
      return () => {
        messageContainer.removeEventListener('wheel', handleWheel);
      };
    }
  }, []);

  const lastMessageIndex = data.chatHistory.length - 1;

  return (
    <div
      className="p-4 border border-gray-300 rounded bg-white text-black relative w-[600px]"
      onClick={handleNodeClick}
    >
      {!isRoot && ( // Only show delete button if not root node
        <div
          className="absolute -top-2 -right-2 z-10 cursor-pointer transition-opacity duration-200 interactive-element"
          style={{ opacity: isHoveringDelete ? '1' : '0.3' }}
          onMouseEnter={() => setIsHoveringDelete(true)}
          onMouseLeave={() => setIsHoveringDelete(false)}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(id);
          }}
        >
          <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </div>
        </div>
      )}

      <Handle
        type="target"
        position={Position.Top}
        style={{ top: -8, background: '#555' }}
        className="interactive-element"
      />

      <div
        ref={messageContainerRef}
        className="flex flex-col space-y-2 mb-2 overflow-y-auto"
        style={{ maxHeight: `${maxNodeHeight}px` }}
      >
        {chatHistory.map((msg, index) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`p-2 rounded-lg max-w-[80%] ${
                msg.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-black'
              }`}
            >
              <MessageContent content={msg.content} />
            </div>
            {msg.sender === 'assistant' &&
              !(isLeaf && index === lastMessageIndex) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onBranch(msg.id);
                  }}
                  className="ml-2 text-gray-400 hover:text-green-500 transition-colors duration-200 interactive-element"
                  style={{ fontSize: '12px', padding: '2px' }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M10 3a1 1 0 100 2h4.586L9.293 10.293a1 1 0 001.414 1.414L16 6.414V11a1 1 0 102 0V4a1 1 0 00-1-1h-7z" />
                  </svg>
                </button>
              )}
          </div>
        ))}
      </div>

      {isLeaf && (
        <div className="mt-2">
          <div className="flex items-center">
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Enter your message"
              onKeyDown={handleKeyDown}
              onClick={(e) => e.stopPropagation()}
              className="flex-1 p-2 border border-gray-300 rounded text-black placeholder:text-gray-600 interactive-element"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                sendMessage();
              }}
              className="ml-2 text-blue-500 hover:text-blue-600 interactive-element"
              aria-label="Send message"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                viewBox="0 0 512 512"
                className="h-5 w-5"
              >
                <path d="M440.6 273.4c4.7-4.5 7.4-10.8 7.4-17.4s-2.7-12.8-7.4-17.4l-176-168c-9.6-9.2-24.8-8.8-33.9 .8s-8.8 24.8 .8 33.9L364.1 232 24 232c-13.3 0-24 10.7-24 24s10.7 24 24 24l340.1 0L231.4 406.6c-9.6 9.2-9.9 24.3-.8 33.9s24.3 9.9 33.9 .8l176-168z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        style={{ bottom: -8, background: '#555' }}
        className="interactive-element"
      />
    </div>
  );
};

export default MessageNode;
