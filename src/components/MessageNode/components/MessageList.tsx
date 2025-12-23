import React from 'react';
import MessageBubble from './MessageBubble';
import LoadingSpinner from '@/components/LoadingSpinner';
import { MessageListProps } from '../types';

const MessageList: React.FC<MessageListProps> = ({
  chatHistory,
  isLeaf,
  isLoading,
  onBranch,
}) => {
  const lastMessageIndex = chatHistory.length - 1;

  return (
    <>
      {chatHistory.map((msg, index) => {
        // Show branch button for assistant messages, except for the last message on leaf nodes
        const showBranchButton =
          msg.sender === 'assistant' && !(isLeaf && index === lastMessageIndex);

        return (
          <MessageBubble
            key={msg.id}
            message={msg}
            showBranchButton={showBranchButton}
            onBranch={onBranch}
          />
        );
      })}

      {isLoading && (
        <div className="flex justify-start items-center gap-2 select-text fade-in px-4 py-2.5 bg-slate-50 rounded-2xl w-fit" style={{ borderRadius: '20px 20px 20px 8px' }}>
          <LoadingSpinner />
          <span className="text-slate-400 text-sm">Thinking...</span>
        </div>
      )}
    </>
  );
};

export default MessageList;

