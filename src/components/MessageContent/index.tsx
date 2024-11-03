import React from 'react';
import ReactMarkdown from 'react-markdown';
import { InlineMath, BlockMath } from 'react-katex';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

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
    <>
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
              rehypePlugins={[rehypeKatex]}
            >
              {segment.content}
            </ReactMarkdown>
          );
        }
      })}
    </>
  );
};

export default MessageContent;
