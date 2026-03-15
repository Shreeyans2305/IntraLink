import { useState } from 'react'
import { formatMessageTime } from '../../features/messaging/messageUtils'
import { useRoomCountdown } from '../../hooks/useRoomCountdown'
import EmojiPicker from '../reactions/EmojiPicker'
import ReactionBar from '../reactions/ReactionBar'
import UserHoverCard from './UserHoverCard'
import Button from '../ui/Button'
import MarkdownText from '../ui/MarkdownText'

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function highlightText(text, query) {
  if (!query) {
    return text
  }

  const safeQuery = escapeRegExp(query)
  const parts = text.split(new RegExp(`(${safeQuery})`, 'ig'))
  return parts.map((part, index) =>
    part.toLowerCase() === query.toLowerCase() ? (
      <mark key={`${part}-${index}`} className="rounded bg-amber-200 px-0.5 text-slate-900">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    ),
  )
}

function MessageBubble({
  message,
  reactions,
  onReact,
  onOpenThread,
  selectionMode,
  selected,
  onToggleSelect,
  searchQuery,
  profile,
  onSaveBookmark,
  onPinMessage,
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const countdown = useRoomCountdown(message.expiryAt ?? 0)
  const expiryText = message.expiryAt && !message.expired ? countdown.formatted : null

  return (
    <article
      className={`rounded-lg border p-3 ${
        message.isSystem
          ? 'border-blue-200 bg-blue-50 text-slate-700'
          : message.isWhisper
          ? 'border-purple-200 bg-purple-50 text-purple-900 border-l-4 border-l-purple-500'
          : 'border-slate-200 bg-white text-slate-900'
      }`}
    >
      <div className="mb-1 flex items-center justify-between gap-3">
        <div className="relative flex items-center gap-2">
          {selectionMode ? <input type="checkbox" checked={selected} onChange={onToggleSelect} /> : null}
          <div onMouseEnter={() => setShowProfile(true)} onMouseLeave={() => setShowProfile(false)}>
            <button type="button" className="text-sm font-semibold">
              {message.isWhisper ? `Private whisper from ${message.authorName} to @${message.targetUsername}` : message.authorName}
            </button>
            {showProfile && profile ? <UserHoverCard profile={profile} /> : null}
          </div>
          <span className="text-xs text-slate-500">{formatMessageTime(message.timestamp)}</span>
        </div>
        <div className="flex items-center gap-2">
          {expiryText ? (
            <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800">
              {expiryText}
            </span>
          ) : null}
          {!message.isSystem ? (
            <>
              <Button variant="ghost" className="px-2 py-1 text-xs" onClick={onSaveBookmark}>
                Save
              </Button>
              <Button variant="ghost" className="px-2 py-1 text-xs" onClick={onPinMessage}>
                Pin
              </Button>
            </>
          ) : null}
          {message.threadCount ? (
            <Button variant="ghost" className="px-2 py-1 text-xs" onClick={onOpenThread}>
              Thread ({message.threadCount})
            </Button>
          ) : (
            <Button variant="ghost" className="px-2 py-1 text-xs" onClick={onOpenThread}>
              Reply in thread
            </Button>
          )}
        </div>
      </div>

      <div className={`text-sm ${message.expired ? 'italic text-slate-500' : ''} ${message.isWhisper ? 'italic' : ''}`}>
        <MarkdownText text={message.text} searchQuery={searchQuery} highlightText={highlightText} />
      </div>

      <div className="mt-2 flex items-start justify-between gap-2">
        <div className="flex-1">
          <ReactionBar reactions={reactions} onReact={onReact} />
        </div>
        <div>
          {showPicker ? <EmojiPicker onSelect={onReact} /> : null}
          <Button
            variant="ghost"
            className="mt-1 px-2 py-1 text-xs"
            onClick={() => setShowPicker((value) => !value)}
          >
            😀 React
          </Button>
        </div>
      </div>
    </article>
  )
}

export default MessageBubble