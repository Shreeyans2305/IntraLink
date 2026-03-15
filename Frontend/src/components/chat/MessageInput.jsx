import { useEffect, useMemo, useRef, useState } from 'react'
import { commandRegistry } from '../../features/commands/commandRegistry'
import Button from '../ui/Button'

function getDraftStorageKey(roomId) {
  return `intralink-draft-${roomId}`
}

function getInitialDraft(roomId) {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.sessionStorage.getItem(getDraftStorageKey(roomId)) ?? ''
}

function MessageInput({
  roomId,
  onSend,
  disabled,
  unauthorized = false,
  smartReplies = [],
  tone,
  onToneChange,
  smartRepliesDismissed,
  onDismissSmartReplies,
  onRestoreSmartReplies,
  onOpenCommandPalette,
  commandHistory = [],
  members = [],
  allUsers = [],
}) {
  const [value, setValue] = useState(() => getInitialDraft(roomId))
  const [previewMode, setPreviewMode] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [activeCommandIndex, setActiveCommandIndex] = useState(0)
  const [activeMentionIndex, setActiveMentionIndex] = useState(0)
  const [activeWhisperIndex, setActiveWhisperIndex] = useState(0)
  const fileInputRef = useRef(null)
  const textareaRef = useRef(null)

  const commandSuggestions = useMemo(() => {
    if (!value.startsWith('/')) {
      return []
    }

    const query = value.slice(1).toLowerCase()
    return commandRegistry.filter((command) => command.name.toLowerCase().includes(query)).slice(0, 6)
  }, [value])

  // Detect @mention queries: find the last '@' that is preceded by a space or is at position 0
  const mentionQuery = useMemo(() => {
    if (!value) return null
    const cursorPos = value.length // assume cursor at end
    const lastAt = value.lastIndexOf('@')
    if (lastAt === -1) return null
    // '@' must be at start or preceded by a space
    if (lastAt > 0 && value[lastAt - 1] !== ' ') return null
    const afterAt = value.slice(lastAt + 1)
    // If there's a space after the query text, mention is complete
    if (afterAt.includes(' ')) return null
    return afterAt.toLowerCase()
  }, [value])

  const mentionSuggestions = useMemo(() => {
    if (mentionQuery === null) return []
    // Build a user map from allUsers for easy name lookup
    const userMap = {}
    for (const u of allUsers) {
      userMap[u.id] = u.name || u.email || u.id
    }
    // Enrich members with names
    const enriched = members.map((m) => ({
      ...m,
      name: userMap[m.user_id] || m.user_id,
    }))
    // Also add any allUsers not in the room (for @everyone or cross-room mentions)
    const memberIds = new Set(members.map((m) => m.user_id))
    for (const u of allUsers) {
      if (!memberIds.has(u.id)) {
        enriched.push({ user_id: u.id, name: u.name || u.email || u.id })
      }
    }
    return enriched
      .filter((m) => m.name.toLowerCase().includes(mentionQuery))
      .slice(0, 6)
  }, [mentionQuery, members, allUsers])

  // Detect /whisper username query
  const whisperQuery = useMemo(() => {
    if (!value) return null
    const match = value.match(/^\/whisper\s+(\S*)$/i)
    if (!match) return null
    return match[1].toLowerCase()
  }, [value])

  const whisperSuggestions = useMemo(() => {
    if (whisperQuery === null || !allUsers.length) return []
    return allUsers
      .filter((u) => {
        const name = (u.name || u.email || '').toLowerCase()
        return name.includes(whisperQuery)
      })
      .slice(0, 6)
  }, [whisperQuery, allUsers])

  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }

    window.sessionStorage.setItem(getDraftStorageKey(roomId), value)
  }, [roomId, value])

  const handleSend = () => {
    const text = value.trim()
    if (!text && !attachments.length) {
      return
    }

    const attachmentText = attachments.length
      ? `\n\nAttachments: ${attachments.map((item) => item.name).join(', ')}`
      : ''

    onSend(`${text || 'Shared files'}${attachmentText}`)
    setValue('')
    setAttachments([])

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(getDraftStorageKey(roomId))
    }
  }

  const handlePickSmartReply = (text) => {
    setValue(text)
    setActiveCommandIndex(0)
  }

  const handleInsertTemplate = (snippet) => {
    setValue((current) => `${current}${current ? ' ' : ''}${snippet}`)
    setActiveCommandIndex(0)
  }

  const handleFiles = (fileList) => {
    const nextFiles = Array.from(fileList).map((file) => ({
      id: `${file.name}-${file.size}-${Date.now()}`,
      name: file.name,
      size: file.size,
    }))
    setAttachments((current) => [...current, ...nextFiles])
  }

  const handleSelectMention = (member) => {
    const name = member.name || member.user_name || 'user'
    const lastAt = value.lastIndexOf('@')
    const before = value.slice(0, lastAt)
    setValue(`${before}@${name} `)
    setActiveMentionIndex(0)
    textareaRef.current?.focus()
  }

  const handleSelectWhisper = (user) => {
    const name = user.name || user.email || 'user'
    setValue(`/whisper ${name} `)
    setActiveWhisperIndex(0)
    textareaRef.current?.focus()
  }

  const handleKeyDown = (event) => {
    // Whisper user navigation (takes priority when /whisper is active)
    if (whisperSuggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveWhisperIndex((c) => Math.min(c + 1, whisperSuggestions.length - 1))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveWhisperIndex((c) => Math.max(c - 1, 0))
        return
      }
      if (event.key === 'Tab' || (event.key === 'Enter' && !event.shiftKey)) {
        event.preventDefault()
        handleSelectWhisper(whisperSuggestions[activeWhisperIndex])
        return
      }
      if (event.key === 'Escape') {
        setValue((v) => v + ' ')
        return
      }
    }

    // Mention navigation
    if (mentionSuggestions.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault()
        setActiveMentionIndex((c) => Math.min(c + 1, mentionSuggestions.length - 1))
        return
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault()
        setActiveMentionIndex((c) => Math.max(c - 1, 0))
        return
      }
      if (event.key === 'Tab' || (event.key === 'Enter' && !event.shiftKey)) {
        event.preventDefault()
        handleSelectMention(mentionSuggestions[activeMentionIndex])
        return
      }
      if (event.key === 'Escape') {
        // Clear mention query by adding a space
        setValue((v) => v + ' ')
        return
      }
    }

    if (event.key === 'ArrowDown' && commandSuggestions.length) {
      event.preventDefault()
      setActiveCommandIndex((current) => Math.min(current + 1, commandSuggestions.length - 1))
    }

    if (event.key === 'ArrowUp' && commandSuggestions.length) {
      event.preventDefault()
      setActiveCommandIndex((current) => Math.max(current - 1, 0))
    }

    if ((event.key === 'Tab' || event.key === 'Enter') && commandSuggestions.length && value.startsWith('/')) {
      if (event.key === 'Tab' || (event.key === 'Enter' && !event.shiftKey)) {
        event.preventDefault()
        setValue(`${commandSuggestions[activeCommandIndex].name} `)
        return
      }
    }

    if (event.key === 'Enter' && !event.shiftKey && !previewMode) {
      event.preventDefault()
      handleSend()
    }
  }

  if (unauthorized) {
    return (
      <div className="border-t border-zinc-800/80 pt-3">
        <div className="flex h-16 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/50 text-sm italic text-zinc-500">
          You don't have permission to message in this room.
        </div>
      </div>
    )
  }

  return (
    <div
      className="border-t border-zinc-800/80 pt-3"
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault()
        handleFiles(event.dataTransfer.files)
      }}
    >
      {!smartRepliesDismissed && smartReplies.length ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {smartReplies.map((reply, index) => (
            <button
              key={`${reply}-${index}`}
              type="button"
              className="rounded-full border border-zinc-800 bg-zinc-900/50 px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800/80 hover:text-brand-400 transition-colors"
              onClick={() => handlePickSmartReply(reply)}
            >
              {reply}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            {['formal', 'casual', 'technical'].map((toneOption) => (
              <button
                key={toneOption}
                type="button"
                onClick={() => onToneChange?.(toneOption)}
                className={`rounded-full px-2 py-1 text-[11px] transition-colors ${
                  tone === toneOption ? 'bg-brand-500/20 text-brand-300 border border-brand-500/50' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                {toneOption}
              </button>
            ))}
            <button
              type="button"
              className="rounded-full bg-zinc-800 px-2 py-1 text-[11px] text-zinc-400 hover:bg-zinc-700 transition-colors"
              onClick={onDismissSmartReplies}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : smartRepliesDismissed ? (
        <div className="mb-2 flex items-center justify-between rounded-xl bg-zinc-900/50 border border-zinc-800/50 px-3 py-2 text-xs text-zinc-500">
          <span>Smart replies hidden for now.</span>
          <button type="button" className="font-medium text-zinc-300 hover:text-brand-400 transition-colors" onClick={onRestoreSmartReplies}>
            Undo
          </button>
        </div>
      ) : null}

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => handleInsertTemplate('**bold**')}>
          Bold
        </Button>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => handleInsertTemplate('`code`')}>
          Code
        </Button>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => handleInsertTemplate('> quote')}>
          Quote
        </Button>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => handleInsertTemplate('- list item')}>
          List
        </Button>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => handleInsertTemplate('@')}>
          Mention
        </Button>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => handleInsertTemplate('😀')}>
          Emoji
        </Button>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => fileInputRef.current?.click()}>
          Attach
        </Button>
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={onOpenCommandPalette}>
          Palette
        </Button>
        <Button
          variant="secondary"
          className="ml-auto px-2 py-1 text-xs"
          onClick={() => setPreviewMode((current) => !current)}
        >
          {previewMode ? 'Edit' : 'Preview'}
        </Button>
      </div>

      {attachments.length ? (
        <div className="mb-2 flex flex-wrap gap-2">
          {attachments.map((file) => (
            <span
              key={file.id}
              className="rounded-full border border-brand-500/50 bg-brand-500/10 px-2 py-1 text-xs text-brand-300 shadow-[0_0_10px_rgba(59,130,246,0.1)]"
            >
              {file.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        {previewMode ? (
          <div className="min-h-[5.5rem] flex-1 whitespace-pre-wrap rounded-xl border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-300">
            {value || 'Nothing to preview yet.'}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            value={value}
            disabled={disabled}
            onChange={(event) => {
              setValue(event.target.value)
              setActiveCommandIndex(0)
              setActiveMentionIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message here or use /help — type @ to mention"
            className="min-h-[5.5rem] flex-1 rounded-xl border border-zinc-700 bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 placeholder-zinc-500 transition-all shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]"
          />
        )}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(event) => handleFiles(event.target.files ?? [])}
        />
        <div className="flex w-24 flex-col gap-2">
          <Button onClick={handleSend} disabled={disabled || previewMode}>
            Send
          </Button>
          <Button variant="secondary" onClick={() => setValue('')} disabled={!value && !attachments.length}>
            Clear
          </Button>
        </div>
      </div>

      {commandSuggestions.length ? (
        <div className="mt-2 space-y-1 rounded-xl border border-zinc-800 bg-zinc-900 p-2 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
          {commandSuggestions.map((command, index) => (
            <button
              key={command.name}
              type="button"
              onClick={() => setValue(`${command.name} `)}
              className={`block w-full rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                activeCommandIndex === index ? 'bg-brand-500/20 text-brand-300' : 'hover:bg-zinc-800/50 text-zinc-300'
              }`}
            >
              <p className="font-medium">{command.name}</p>
              <p className={`text-xs ${activeCommandIndex === index ? 'text-brand-400/80' : 'text-zinc-500'}`}>
                {command.description}
              </p>
            </button>
          ))}
        </div>
      ) : null}

      {mentionSuggestions.length > 0 ? (
        <div className="mt-2 space-y-1 rounded-xl border border-brand-500/30 bg-zinc-900 p-2 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-brand-400">Mention a user</p>
          {mentionSuggestions.map((member, index) => (
            <button
              key={member.user_id || member.id || index}
              type="button"
              onClick={() => handleSelectMention(member)}
              className={`block w-full rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                activeMentionIndex === index ? 'bg-brand-500/20 text-brand-300' : 'hover:bg-zinc-800/50 text-zinc-300'
              }`}
            >
              <span className="font-medium">@{member.name || member.user_name}</span>
            </button>
          ))}
        </div>
      ) : null}

      {whisperSuggestions.length > 0 ? (
        <div className="mt-2 space-y-1 rounded-xl border border-brand-500/30 bg-zinc-900 p-2 shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-md">
          <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-brand-400">Whisper to</p>
          {whisperSuggestions.map((user, index) => (
            <button
              key={user.id || index}
              type="button"
              onClick={() => handleSelectWhisper(user)}
              className={`block w-full rounded-lg px-2 py-2 text-left text-sm transition-colors ${
                activeWhisperIndex === index ? 'bg-brand-500/20 text-brand-300' : 'hover:bg-zinc-800/50 text-zinc-300'
              }`}
            >
              <span className="font-medium">{user.name || user.email}</span>
            </button>
          ))}
        </div>
      ) : null}

      {!value && commandHistory.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {commandHistory.slice(0, 4).map((command, index) => (
            <button
              key={`${command}-${index}`}
              type="button"
              className="rounded-full border border-zinc-800 bg-zinc-900/50 px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-800/80 transition-colors"
              onClick={() => setValue(command)}
            >
              {command}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-zinc-500">
          Commands: {commandRegistry.map((item) => item.name).join(' · ')}
        </p>
        <p className="text-xs text-zinc-600">Drafts save per room. Drag and drop files here.</p>
      </div>
    </div>
  )
}

export default MessageInput