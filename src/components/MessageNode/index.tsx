import React, { useState, useCallback } from 'react';
import { Handle, Position } from 'reactflow';
import { maxNodeHeight } from '@/constants/layout';
import { MessageNodeData } from '@/types/chat';
import {
  DeleteButton,
  MessageList,
  MessageInput,
} from './components';
import { useNodeZoom, useScrollContainer } from './hooks';
import { NODE_WIDTH, HANDLE_STYLE } from './constants';

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
      isLeaf,
      isRoot,
      isLoading,
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

    return (
      <div
        className="p-4 border border-gray-300 rounded bg-white text-black relative select-text"
        style={{ width: NODE_WIDTH }}
        onClick={zoomToNode}
      >
        {!isRoot && <DeleteButton onDelete={handleDelete} />}

        <Handle
          type="target"
          position={Position.Top}
          style={{ top: -8, ...HANDLE_STYLE }}
          className="interactive-element"
        />

        <div
          ref={containerRef}
          className="flex flex-col space-y-2 mb-2 overflow-y-auto select-text"
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
          />
        )}

        <Handle
          type="source"
          position={Position.Bottom}
          style={{ bottom: -8, ...HANDLE_STYLE }}
          className="interactive-element"
        />
      </div>
    );
  }
);

MessageNode.displayName = 'MessageNode';

export default MessageNode;
