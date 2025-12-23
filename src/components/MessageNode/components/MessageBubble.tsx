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
        className={`p-2 rounded-lg max-w-[80%] ${
          isUser ? 'bg-blue-500 text-white' : 'bg-gray-200 text-black'
        } select-text`}
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

