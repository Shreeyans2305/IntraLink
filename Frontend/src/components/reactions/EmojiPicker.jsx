const quickEmojis = ['👍', '🎉', '✅', '🔥', '👀', '💡']

function EmojiPicker({ onSelect }) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white p-1">
      {quickEmojis.map((emoji) => (
        <button
          key={emoji}
          className="rounded px-1.5 py-1 text-sm hover:bg-slate-100"
          onClick={() => onSelect(emoji)}
          type="button"
        >
          {emoji}
        </button>
      ))}
    </div>
  )
}

export default EmojiPicker