import React, { useCallback } from 'react';
import { MessageInputProps } from '../types';

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
}) => {
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  return (
    <div className="mt-2">
      <div
        className="flex items-center"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter your message"
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 p-2 border border-gray-300 rounded text-black placeholder:text-gray-600 interactive-element select-text"
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSend();
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
  );
};

export default MessageInput;

