import React, { useCallback, useState } from 'react';
import { MessageInputProps } from '../types';

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  onFocus,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <div
        className="flex items-end gap-2"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your message..."
          onKeyDown={handleKeyDown}
          onClick={(e) => e.stopPropagation()}
          onFocus={handleFocus}
          onBlur={handleBlur}
          rows={1}
          className={`flex-1 w-full px-4 py-3 bg-slate-50 border rounded-xl text-slate-800 placeholder:text-slate-400 interactive-element select-text resize-none transition-all duration-200 ${
            isFocused
              ? 'bg-white border-blue-400 ring-2 ring-blue-100 shadow-sm'
              : 'border-slate-200 hover:border-slate-300'
          }`}
          style={{ minHeight: '44px' }}
        />
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSend();
          }}
          className="p-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200 interactive-element hover:scale-105 active:scale-95 shadow-md h-[44px] w-[44px] flex items-center justify-center shrink-0"
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

