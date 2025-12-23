import React, { useState, useCallback, useMemo } from 'react';
import { Handle, Position } from 'reactflow';
import { maxNodeHeight } from '@/constants/layout';
import { MessageNodeData } from '@/types/chat';
import {
  DeleteButton,
  MessageList,
  MessageInput,
} from './components';
import { useNodeZoom, useScrollContainer } from './hooks';
import { NODE_WIDTH } from './constants';

interface MessageNodeProps {
  data: MessageNodeData;
  id: string;
}

const MessageNode: React.FC<MessageNodeProps> = React.memo(
  ({ data, id }) => {
    const {
      chatHistory,
      onSendMessage,
      onBranch,
      onDelete,
      onSetActive,
      isLeaf,
      isRoot,
      isLoading,
      isOnActivePath,
    } = data;

    const [inputValue, setInputValue] = useState('');

    // Custom hooks for zoom and scroll behavior
    const { zoomToNode } = useNodeZoom({ nodeId: id });
    const { containerRef } = useScrollContainer({ chatHistory });

    const handleSend = useCallback(() => {
      const trimmedInput = inputValue.trim();
      if (trimmedInput !== '') {
        onSendMessage(trimmedInput);
        setInputValue('');
      }
    }, [inputValue, onSendMessage]);

    const handleDelete = useCallback(() => {
      onDelete(id);
    }, [onDelete, id]);

    const handleNodeClick = useCallback(
      (event: React.MouseEvent) => {
        onSetActive(id);
        zoomToNode(event);
      },
      [onSetActive, id, zoomToNode]
    );

    const handleInputFocus = useCallback(() => {
      onSetActive(id);
    }, [onSetActive, id]);

    // Dynamic styles based on active state
    const containerStyle = useMemo(
      () => ({
        width: NODE_WIDTH,
        backgroundColor: '#ffffff',
        borderColor: isOnActivePath ? '#cbd5e1' : '#e2e8f0',
        boxShadow: isOnActivePath
          ? '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
      }),
      [isOnActivePath]
    );

    const handleStyle = useMemo(
      () => ({
        width: 10,
        height: 10,
        backgroundColor: '#94a3b8',
        border: '2px solid white',
      }),
      []
    );

    return (
      <div
        className="p-5 rounded-xl relative select-text transition-all duration-200 node-enter border"
        style={containerStyle}
        onClick={handleNodeClick}
      >
        {!isRoot && <DeleteButton onDelete={handleDelete} />}

        <Handle
          type="target"
          position={Position.Top}
          style={{ top: -6, ...handleStyle }}
          className="interactive-element"
        />

        <div
          ref={containerRef}
          className="flex flex-col space-y-3 mb-3 overflow-y-auto select-text"
          style={{ maxHeight: maxNodeHeight }}
        >
          <MessageList
            chatHistory={chatHistory}
            isLeaf={isLeaf}
            isLoading={isLoading}
            onBranch={onBranch}
          />
        </div>

        {isLeaf && (
          <MessageInput
            value={inputValue}
            onChange={setInputValue}
            onSend={handleSend}
            onFocus={handleInputFocus}
          />
        )}

        <Handle
          type="source"
          position={Position.Bottom}
          style={{ bottom: -6, ...handleStyle }}
          className="interactive-element"
        />
      </div>
    );
  }
);

MessageNode.displayName = 'MessageNode';

export default MessageNode;
