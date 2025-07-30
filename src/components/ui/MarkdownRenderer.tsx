import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { cn } from '@/lib/utils';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
  content, 
  className
}) => {
  const containerClasses = cn(
    "prose prose-sm max-w-none min-w-0",  
    "prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground",
    "prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground",
    "prose-blockquote:text-muted-foreground prose-blockquote:border-border",
    "prose-th:text-foreground prose-td:text-foreground prose-th:border-border prose-td:border-border",
    "prose-ul:text-foreground prose-ol:text-foreground prose-li:text-foreground",
    className
  );

  // Pre-process content to handle inline code properly
  const processedContent = content

  return (
    <div className={`${containerClasses} overflow-hidden`} style={{ maxWidth: '100%', minWidth: '0' }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code(props) {
            const { children, className, node, ...rest } = props;
            const match = /language-(\w+)/.exec(className || '');
            
            // If it has a language class, it's a code block
            if (match) {
              return (
                <div className="relative min-w-0 max-w-full overflow-hidden">
                  <div className="overflow-x-auto">
                    <SyntaxHighlighter
                      style={oneDark as any}
                      language={match[1]}
                      PreTag="div"
                      className="rounded-lg !my-2 max-h-96 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-400 hover:scrollbar-thumb-gray-500"
                      customStyle={{
                        margin: '0.5rem 0',
                        fontSize: '0.875rem',
                        maxHeight: '384px', // 24rem = 384px
                        overflowX: 'auto',
                        overflowY: 'auto',
                        maxWidth: '100%',
                        minWidth: 'fit-content',
                      }}
                      wrapLongLines={false}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  </div>
                </div>
              );
            }
            
            // For inline code - clean the content of any backticks
            const cleanContent = String(children).replace(/`/g, '');
            
            return (
              <code 
                className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-sm font-mono text-slate-800 dark:text-slate-200 border-0 before:content-none after:content-none"
                {...rest}
              >
                {cleanContent}
              </code>
            );
          },
          p: ({ children }) => (
            <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="mb-3 pl-6 list-disc space-y-1">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-3 pl-6 list-decimal space-y-1">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          h1: ({ children }) => (
            <h1 className="text-xl font-bold mb-4 mt-6 first:mt-0 text-foreground border-b border-border pb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-bold mb-3 mt-5 first:mt-0 text-foreground">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-bold mb-2 mt-4 first:mt-0 text-foreground">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm font-bold mb-2 mt-3 first:mt-0 text-foreground">
              {children}
            </h4>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-primary pl-4 py-2 my-4 bg-muted/50 rounded-r-lg">
              <div className="text-muted-foreground italic">{children}</div>
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-border min-w-0 max-w-full">
              <table className="w-full border-collapse bg-background text-sm min-w-0">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted">{children}</thead>
          ),
          th: ({ children }) => (
            <th className="border-r border-border px-3 py-2 font-semibold text-left last:border-r-0">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-r border-border border-t px-3 py-2 last:border-r-0">
              {children}
            </td>
          ),
          hr: () => (
            <hr className="my-6 border-border" />
          ),
          a: ({ children, href }) => (
            <a 
              href={href} 
              className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-foreground">{children}</em>
          ),
          del: ({ children }) => (
            <del className="line-through text-muted-foreground">{children}</del>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;