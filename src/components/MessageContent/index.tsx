import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { InlineMath, BlockMath } from 'react-katex';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import 'katex/dist/katex.min.css';
import 'highlight.js/styles/github.css';

interface MessageContentProps {
  content: string;
}

interface CodeComponentProps
  extends React.HTMLAttributes<HTMLElement> {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

// Memoized components object to prevent recreation on every render
const markdownComponents = {
  code({ inline, className, children, ...props }: CodeComponentProps) {
    const match = /language-(\w+)/.exec(className || '');

    if (!inline && match) {
      return (
        <pre
          className={`${className} overflow-x-auto p-2 bg-gray-800 rounded text-sm select-text`}
        >
          <code {...props} className="text-sm">
            {children}
          </code>
        </pre>
      );
    } else {
      return (
        <code
          className={`${className} bg-gray-200 rounded px-1 text-sm select-text`}
          {...props}
        >
          {children}
        </code>
      );
    }
  },
};

// Pre-process to normalize LaTeX delimiters
const preprocessContent = (text: string): string => {
  return text
    .replace(/\\\[([\s\S]*?)\\\]/g, '$$$$$1$$$$') // \[ ... \] -> $$ ... $$
    .replace(/\\\(([\s\S]*?)\\\)/g, '$$$1$$'); // \( ... \) -> $ ... $
};

// Parse content into segments of text and latex
const parseContent = (text: string) => {
  const preprocessed = preprocessContent(text);
  const segments: { type: 'text' | 'latex'; content: string }[] = [];
  let currentText = '';
  let i = 0;

  while (i < preprocessed.length) {
    if (preprocessed.slice(i, i + 2) === '$$') {
      if (currentText) {
        segments.push({ type: 'text', content: currentText });
        currentText = '';
      }

      const end = preprocessed.indexOf('$$', i + 2);
      if (end === -1) {
        currentText += preprocessed.slice(i);
        break;
      }

      segments.push({
        type: 'latex',
        content: preprocessed.slice(i + 2, end),
      });
      i = end + 2;
    } else {
      currentText += preprocessed[i];
      i++;
    }
  }

  if (currentText) {
    segments.push({ type: 'text', content: currentText });
  }

  return segments;
};

const MessageContent: React.FC<MessageContentProps> = React.memo(
  ({ content }) => {
    // Memoize the parsed segments to prevent re-parsing on every render
    const segments = useMemo(() => parseContent(content), [content]);

    return (
      <div className="select-text overflow-x-auto">
        {segments.map((segment, index) => {
          if (segment.type === 'latex') {
            try {
              return segment.content.includes('\n') ? (
                <BlockMath key={index} math={segment.content} />
              ) : (
                <InlineMath key={index} math={segment.content} />
              );
            } catch {
              return <span key={index}>Error rendering LaTeX</span>;
            }
          } else {
            return (
              <ReactMarkdown
                key={index}
                remarkPlugins={[remarkMath]}
                rehypePlugins={[rehypeKatex, rehypeHighlight]}
                components={markdownComponents}
                className="select-text"
              >
                {segment.content}
              </ReactMarkdown>
            );
          }
        })}
      </div>
    );
  }
);

MessageContent.displayName = 'MessageContent';

export default MessageContent;
