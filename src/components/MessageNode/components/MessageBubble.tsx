import React from 'react';
import MessageContent from '@/components/MessageContent';
import BranchButton from './BranchButton';
import { MessageBubbleProps } from '../types';

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  showBranchButton,
  onBranch,
}) => {
  const isUser = message.sender === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} select-text message-enter`}
    >
      <div
        className={`px-4 py-2.5 rounded-2xl max-w-[85%] select-text overflow-x-auto ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20'
            : 'bg-slate-100 text-slate-800'
        }`}
        style={{
          borderRadius: isUser ? '20px 20px 8px 20px' : '20px 20px 20px 8px',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <MessageContent content={message.content} />
      </div>
      {!isUser && showBranchButton && (
        <BranchButton messageId={message.id} onBranch={onBranch} />
      )}
    </div>
  );
};

export default MessageBubble;

