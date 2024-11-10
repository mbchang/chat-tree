import React from 'react';
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

const MessageContent: React.FC<MessageContentProps> = ({
  content,
}) => {
  const parseContent = (text: string) => {
    const segments: { type: 'text' | 'latex'; content: string }[] =
      [];
    let currentText = '';
    let i = 0;

    while (i < text.length) {
      if (text.slice(i, i + 2) === '$$') {
        if (currentText) {
          segments.push({ type: 'text', content: currentText });
          currentText = '';
        }

        const end = text.indexOf('$$', i + 2);
        if (end === -1) {
          currentText += text.slice(i);
          break;
        }

        segments.push({
          type: 'latex',
          content: text.slice(i + 2, end),
        });
        i = end + 2;
      } else {
        currentText += text[i];
        i++;
      }
    }

    if (currentText) {
      segments.push({ type: 'text', content: currentText });
    }

    return segments;
  };

  const segments = parseContent(content);

  return (
    <div>
      {segments.map((segment, index) => {
        if (segment.type === 'latex') {
          try {
            return segment.content.includes('\n') ? (
              <BlockMath key={index} math={segment.content} />
            ) : (
              <InlineMath key={index} math={segment.content} />
            );
          } catch (error) {
            return <span key={index}>Error rendering LaTeX</span>;
          }
        } else {
          return (
            <ReactMarkdown
              key={index}
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex, rehypeHighlight]}
              components={{
                code({
                  node,
                  inline,
                  className,
                  children,
                  ...props
                }) {
                  const match = /language-(\w+)/.exec(
                    className || ''
                  );

                  if (!inline && match) {
                    return (
                      <pre
                        className={`${className} overflow-x-auto p-2 bg-gray-800 rounded text-sm`}
                      >
                        <code {...props} className="text-sm">
                          {children}
                        </code>
                      </pre>
                    );
                  } else {
                    return (
                      <code
                        className={`${className} bg-gray-200 rounded px-1 text-sm`}
                        {...props}
                      >
                        {children}
                      </code>
                    );
                  }
                },
              }}
            >
              {segment.content}
            </ReactMarkdown>
          );
        }
      })}
    </div>
  );
};

export default MessageContent;
