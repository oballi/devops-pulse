import React from 'react';

interface MarkdownRendererProps {
  content: string;
}

// Simple regex-based markdown parser for a lightweight solution without heavy dependencies.
// Handles headings, paragraphs, code blocks, bold, italic, links, images.
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let codeBlockOpen = false;
    let codeLanguage = '';
    let codeBuffer: string[] = [];

    lines.forEach((line, index) => {
      // Code Blocks - check for ``` at the start (with possible leading whitespace)
      if (line.trim().startsWith('```')) {
        if (codeBlockOpen) {
          // Close block
          elements.push(
            <div key={`code-${index}`} className="my-6 rounded-xl overflow-hidden bg-[#1e1e2e] dark:bg-[#1e1e2e] text-gray-100 font-mono text-sm shadow-lg border border-gray-800">
               {codeLanguage && (
                 <div className="bg-[#181825] px-4 py-2 text-xs text-gray-400 border-b border-gray-700 flex items-center justify-between">
                   <span className="uppercase tracking-wider">{codeLanguage}</span>
                   <button 
                     onClick={() => navigator.clipboard.writeText(codeBuffer.join('\n'))}
                     className="text-gray-500 hover:text-gray-300 transition-colors text-xs"
                   >
                     Kopyala
                   </button>
                 </div>
               )}
              <pre className="p-4 overflow-x-auto leading-relaxed">
                <code className="text-[#cdd6f4]">{codeBuffer.join('\n')}</code>
              </pre>
            </div>
          );
          codeBuffer = [];
          codeLanguage = '';
          codeBlockOpen = false;
        } else {
          // Open block
          codeBlockOpen = true;
          codeLanguage = line.trim().replace(/^```/, '').trim();
        }
        return;
      }

      if (codeBlockOpen) {
        codeBuffer.push(line);
        return;
      }

      // Headers
      if (line.startsWith('## ')) {
        elements.push(<h2 key={index} className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mt-10 mb-4 tracking-tight leading-tight font-sans">{parseInline(line.replace('## ', ''))}</h2>);
        return;
      }
      if (line.startsWith('### ')) {
        elements.push(<h3 key={index} className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-8 mb-3 tracking-tight font-sans">{parseInline(line.replace('### ', ''))}</h3>);
        return;
      }

      // Lists
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
          elements.push(<li key={index} className="ml-6 list-disc text-gray-700 dark:text-gray-300 mb-2 pl-2 font-serif text-lg leading-relaxed">{parseInline(line.replace(/^[-*]\s/, ''))}</li>);
          return;
      }
      
      // Paragraphs (empty lines skip)
      if (line.trim() === '') {
        return;
      }

      // Check if line is purely an image to render it without paragraph wrapping if preferred, 
      // or just let parseInline handle it.
      // For better styling, we can check if the line is ONLY an image.
      const imageMatch = line.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imageMatch) {
          elements.push(
              <figure key={index} className="my-8">
                  <img src={imageMatch[2]} alt={imageMatch[1]} className="w-full rounded-lg shadow-sm" />
                  {imageMatch[1] && <figcaption className="text-center text-sm text-gray-500 mt-2">{imageMatch[1]}</figcaption>}
              </figure>
          );
          return;
      }

      elements.push(
        <p key={index} className="mb-6 text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed font-serif antialiased">
          {parseInline(line)}
        </p>
      );
    });

    // Eğer kod bloğu kapanmadan dosya bittiyse, kalan kodu render et
    if (codeBlockOpen && codeBuffer.length > 0) {
      elements.push(
        <div key="code-final" className="my-6 rounded-xl overflow-hidden bg-[#1e1e2e] dark:bg-[#1e1e2e] text-gray-100 font-mono text-sm shadow-lg border border-gray-800">
           {codeLanguage && (
             <div className="bg-[#181825] px-4 py-2 text-xs text-gray-400 border-b border-gray-700 flex items-center justify-between">
               <span className="uppercase tracking-wider">{codeLanguage}</span>
               <button 
                 onClick={() => navigator.clipboard.writeText(codeBuffer.join('\n'))}
                 className="text-gray-500 hover:text-gray-300 transition-colors text-xs"
               >
                 Kopyala
               </button>
             </div>
           )}
          <pre className="p-4 overflow-x-auto leading-relaxed">
            <code className="text-[#cdd6f4]">{codeBuffer.join('\n')}</code>
          </pre>
        </div>
      );
    }

    return elements;
  };

  const parseInline = (text: string) => {
      // Split by patterns: 
      // 1. Images: ![alt](url)
      // 2. Links: [text](url)
      // 3. Bold: **text**
      // 4. Code: `text`
      
      // We use a regex with capturing groups to keep the delimiters in the split result
      const parts = text.split(/(!\[.*?\]\(.*?\)|\[.*?\]\(.*?\)|(?:\*\*.*?\*\*)|(?:`.*?`))/g);
      
      return parts.map((part, i) => {
          // Image
          const imageMatch = part.match(/^!\[(.*?)\]\((.*?)\)$/);
          if (imageMatch) {
              return <img key={i} src={imageMatch[2]} alt={imageMatch[1]} className="max-w-full h-auto rounded-lg inline-block align-middle" />;
          }

          // Link
          const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
          if (linkMatch) {
              return (
                <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline decoration-2 underline-offset-2">
                    {linkMatch[1]}
                </a>
              );
          }

          // Bold
          if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-bold text-gray-900 dark:text-white">{part.slice(2, -2)}</strong>;
          }

          // Code
          if (part.startsWith('`') && part.endsWith('`')) {
              return <code key={i} className="bg-gray-100 dark:bg-dark-card text-red-600 dark:text-red-400 px-1 py-0.5 rounded font-mono text-base">{part.slice(1, -1)}</code>;
          }

          return part;
      });
  };

  return <div className="prose prose-lg dark:prose-invert max-w-none">{renderContent(content)}</div>;
};

export default MarkdownRenderer;