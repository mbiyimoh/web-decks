'use client';

import { useState } from 'react';

interface CodeBlockProps {
  children: string;
  language?: string;
  className?: string;
  showCopy?: boolean;
}

export function CodeBlock({
  children,
  language = 'typescript',
  className = '',
  showCopy = true,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative group ${className}`}>
      <div className="bg-[#0d0d14] border border-white/[0.08] rounded-xl p-4 overflow-x-auto">
        <pre className="text-[#888888] font-mono text-sm whitespace-pre-wrap">
          {children}
        </pre>
      </div>

      {showCopy && (
        <button
          onClick={handleCopy}
          className="
            absolute top-2 right-2
            px-2 py-1 text-xs
            bg-white/[0.05] hover:bg-white/[0.1]
            border border-white/[0.08] rounded
            text-[#888888] hover:text-[#f5f5f5]
            opacity-0 group-hover:opacity-100
            transition-all duration-200
          "
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      )}
    </div>
  );
}
