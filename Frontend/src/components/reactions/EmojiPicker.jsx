const quickEmojis = ['👍', '🎉', '✅', '🔥', '👀', '💡']

function EmojiPicker({ onSelect }) {
  return (
    <div className="flex items-center gap-1 rounded-md border border-zinc-800 bg-zinc-900/40 p-1">
      {quickEmojis.map((emoji) => (
        <button
          key={emoji}
          className="rounded px-1.5 py-1 text-sm hover:bg-zinc-800 transition-colors"
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