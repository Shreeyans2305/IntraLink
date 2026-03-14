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
  smartReplies = [],
  tone,
  onToneChange,
  smartRepliesDismissed,
  onDismissSmartReplies,
  onRestoreSmartReplies,
  onOpenCommandPalette,
  commandHistory = [],
}) {
  const [value, setValue] = useState(() => getInitialDraft(roomId))
  const [previewMode, setPreviewMode] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [activeCommandIndex, setActiveCommandIndex] = useState(0)
  const fileInputRef = useRef(null)

  const commandSuggestions = useMemo(() => {
    if (!value.startsWith('/')) {
      return []
    }

    const query = value.slice(1).toLowerCase()
    return commandRegistry.filter((command) => command.name.toLowerCase().includes(query)).slice(0, 6)
  }, [value])

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

  const handleKeyDown = (event) => {
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

  return (
    <div
      className="border-t border-slate-200 pt-3"
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
              className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700 hover:bg-slate-100"
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
                className={`rounded-full px-2 py-1 text-[11px] ${
                  tone === toneOption ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {toneOption}
              </button>
            ))}
            <button
              type="button"
              className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600"
              onClick={onDismissSmartReplies}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : smartRepliesDismissed ? (
        <div className="mb-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          <span>Smart replies hidden for now.</span>
          <button type="button" className="font-medium text-slate-800" onClick={onRestoreSmartReplies}>
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
        <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => handleInsertTemplate('@team')}>
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
              className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700"
            >
              {file.name}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex gap-2">
        {previewMode ? (
          <div className="min-h-[5.5rem] flex-1 whitespace-pre-wrap rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-700">
            {value || 'Nothing to preview yet.'}
          </div>
        ) : (
          <textarea
            value={value}
            disabled={disabled}
            onChange={(event) => {
              setValue(event.target.value)
              setActiveCommandIndex(0)
            }}
            onKeyDown={handleKeyDown}
            placeholder="Message here or use /help"
            className="min-h-[5.5rem] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
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
        <div className="mt-2 space-y-1 rounded-lg border border-slate-200 bg-white p-2">
          {commandSuggestions.map((command, index) => (
            <button
              key={command.name}
              type="button"
              onClick={() => setValue(`${command.name} `)}
              className={`block w-full rounded-md px-2 py-2 text-left text-sm ${
                activeCommandIndex === index ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
              }`}
            >
              <p className="font-medium">{command.name}</p>
              <p className={`text-xs ${activeCommandIndex === index ? 'text-slate-300' : 'text-slate-500'}`}>
                {command.description}
              </p>
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
              className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
              onClick={() => setValue(command)}
            >
              {command}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">
          Commands: {commandRegistry.map((item) => item.name).join(' · ')}
        </p>
        <p className="text-xs text-slate-400">Drafts save per room. Drag and drop files here.</p>
      </div>
    </div>
  )
}

export default MessageInput