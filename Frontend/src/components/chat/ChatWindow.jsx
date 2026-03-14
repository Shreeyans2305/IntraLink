import EmptyState from '../ui/EmptyState'
import MessageBubble from './MessageBubble'

function ChatWindow({
  messages,
  reactionsByMessage,
  onReact,
  onOpenThread,
  selectionMode,
  selectedMessageIds,
  onToggleSelect,
  searchQuery,
  userDirectory,
  firstUnreadMessageId,
  scrollRef,
  onScroll,
  onSaveBookmark,
  onPinMessage,
}) {
  if (!messages.length) {
    return (
      <EmptyState
        title="No messages yet"
        description="Start the room with a message, slash command, or poll to kick off the conversation."
      />
    )
  }

  return (
    <div ref={scrollRef} onScroll={onScroll} className="flex-1 space-y-3 overflow-y-auto pr-1">
      {messages.map((message) => (
        <div key={message.id}>
          {firstUnreadMessageId === message.id ? (
            <div className="mb-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-amber-300" />
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
                Unread
              </span>
              <div className="h-px flex-1 bg-amber-300" />
            </div>
          ) : null}

          <MessageBubble
            message={message}
            reactions={reactionsByMessage[message.id]}
            onReact={(emoji) => onReact(message.id, emoji)}
            onOpenThread={() => onOpenThread(message)}
            selectionMode={selectionMode}
            selected={selectedMessageIds.includes(message.id)}
            onToggleSelect={() => onToggleSelect(message.id)}
            searchQuery={searchQuery}
            profile={userDirectory[message.authorId]}
            onSaveBookmark={() => onSaveBookmark(message)}
            onPinMessage={() => onPinMessage(message)}
          />
        </div>
      ))}
    </div>
  )
}

export default ChatWindow