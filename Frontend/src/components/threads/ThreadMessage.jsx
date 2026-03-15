import MarkdownText from '../ui/MarkdownText'

function ThreadMessage({ item }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-2">
      <div className="mb-1 text-xs font-semibold text-slate-700">{item.authorName}</div>
      <div className="text-sm text-slate-800"><MarkdownText text={item.text} /></div>
    </div>
  )
}

export default ThreadMessage