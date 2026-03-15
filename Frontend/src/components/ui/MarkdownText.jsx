import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

export default function MarkdownText({ text, searchQuery, highlightText }) {
  if (searchQuery && highlightText) {
    return <p>{highlightText(text, searchQuery)}</p>
  }

  return (
    <ReactMarkdown 
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({node, ...props}) => <p className="mb-1 last:mb-0" {...props} />,
        a: ({node, ...props}) => <a className="text-cyan-600 hover:underline" {...props} />,
        code: ({node, inline, className, children, ...props}) => {
          const match = /language-(\w+)/.exec(className || '')
          return inline ? (
            <code className="rounded bg-zinc-800 px-1 py-0.5 font-mono text-xs text-pink-600" {...props}>{children}</code>
          ) : (
            <div className="mt-2 mb-2 overflow-hidden rounded-md bg-zinc-900">
              <div className="flex bg-zinc-950 px-3 py-1 text-[10px] text-zinc-400 uppercase tracking-widest">{match ? match[1] : 'code'}</div>
              <pre className="overflow-x-auto p-3 font-mono text-xs text-slate-50"><code {...props} className={className}>{children}</code></pre>
            </div>
          )
        },
        blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-zinc-700 pl-3 italic text-zinc-400 mt-2 mb-2 bg-zinc-900/60 py-1" {...props} />,
        ul: ({node, ...props}) => <ul className="list-inside list-disc mt-1 mb-2 space-y-1" {...props} />,
        ol: ({node, ...props}) => <ol className="list-inside list-decimal mt-1 mb-2 space-y-1" {...props} />
      }}
    >
      {text}
    </ReactMarkdown>
  )
}
