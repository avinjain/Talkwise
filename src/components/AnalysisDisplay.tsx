'use client';

import ReactMarkdown from 'react-markdown';

const markdownComponents = {
  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className="text-sm font-semibold text-slate-800 mt-4 mb-2 first:mt-0">{children}</h3>
  ),
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className="text-sm font-semibold text-slate-800 mt-4 mb-2 first:mt-0">{children}</h3>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className="text-sm font-medium text-slate-700 mt-3 mb-1.5">{children}</h3>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props} className="text-sm text-slate-600 leading-relaxed mb-2 last:mb-0">{children}</p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} className="list-disc text-sm text-slate-600 space-y-1.5 mb-3 ml-4 pl-1">{children}</ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol {...props} className="list-decimal text-sm text-slate-600 space-y-1.5 mb-3 ml-4 pl-1">{children}</ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li {...props} className="leading-relaxed">{children}</li>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong {...props} className="font-semibold text-slate-700">{children}</strong>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote {...props} className="border-l-2 border-slate-200 pl-3 my-2 text-slate-600 italic">{children}</blockquote>
  ),
  a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props} className="text-brand-600 hover:text-brand-700 underline">{children}</a>
  ),
};

interface AnalysisDisplayProps {
  content: string;
  className?: string;
  /** Use smaller text (text-xs) */
  compact?: boolean;
}

const compactComponents = {
  h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className="text-xs font-semibold text-slate-800 mt-3 mb-1.5 first:mt-0">{children}</h3>
  ),
  h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className="text-xs font-semibold text-slate-800 mt-3 mb-1.5 first:mt-0">{children}</h3>
  ),
  h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 {...props} className="text-xs font-medium text-slate-700 mt-2 mb-1">{children}</h3>
  ),
  p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p {...props} className="text-xs text-slate-600 leading-relaxed mb-1.5 last:mb-0">{children}</p>
  ),
  ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
    <ul {...props} className="list-disc text-xs text-slate-600 space-y-1 mb-2 ml-4 pl-1">{children}</ul>
  ),
  ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
    <ol {...props} className="list-decimal text-xs text-slate-600 space-y-1 mb-2 ml-4 pl-1">{children}</ol>
  ),
  li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
    <li {...props} className="leading-relaxed">{children}</li>
  ),
  strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
    <strong {...props} className="font-semibold text-slate-700">{children}</strong>
  ),
  blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote {...props} className="border-l-2 border-slate-200 pl-2 my-1.5 text-slate-600 italic text-xs">{children}</blockquote>
  ),
  a: ({ children, href, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a href={href} {...props} className="text-brand-600 hover:text-brand-700 underline">{children}</a>
  ),
};

/** Renders markdown-formatted analysis text with consistent styling */
export default function AnalysisDisplay({ content, className = '', compact = false }: AnalysisDisplayProps) {
  const components = compact ? compactComponents : markdownComponents;
  return (
    <div className={`analysis-content ${className}`}>
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
