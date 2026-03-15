import MarkdownText from '../ui/MarkdownText'

function ThreadMessage({ item }) {
  return (
    <div className="rounded-md border border-zinc-800 bg-zinc-900/40 p-2">
      <div className="mb-1 text-xs font-semibold text-zinc-300">{item.authorName}</div>
      <div className="text-sm text-zinc-200"><MarkdownText text={item.text} /></div>
    </div>
  )
}

export default ThreadMessage