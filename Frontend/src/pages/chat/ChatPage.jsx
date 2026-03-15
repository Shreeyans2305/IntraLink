import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ArrowDownCircle, Bell, Command, Keyboard, Search, Star, Plus, UserPlus } from 'lucide-react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import ChatWindow from '../../components/chat/ChatWindow'
import CommandPalette from '../../components/chat/CommandPalette'
import MessageInput from '../../components/chat/MessageInput'
import SearchOverlay from '../../components/chat/SearchOverlay'
import SidebarSection from '../../components/chat/SidebarSection'
import TypingIndicator from '../../components/chat/TypingIndicator'
import NotificationCenter from '../../components/notifications/NotificationCenter'
import UnreadBadge from '../../components/notifications/UnreadBadge'
import PollCard from '../../components/polls/PollCard'
import PollModal from '../../components/polls/PollModal'
import StatusIndicator from '../../components/presence/StatusIndicator'
import StatusPicker from '../../components/presence/StatusPicker'
import RoomExpiredBanner from '../../components/temprooms/RoomExpiredBanner'
import TempRoomBadge from '../../components/temprooms/TempRoomBadge'
import ThreadPanel from '../../components/threads/ThreadPanel'
import EmptyState from '../../components/ui/EmptyState'
import ShortcutModal from '../../components/ui/ShortcutModal'
import SkeletonBlock from '../../components/ui/SkeletonBlock'
import Toast from '../../components/ui/Toast'
import CreateRoomModal from '../../components/chat/CreateRoomModal'
import ManageMembersModal from '../../components/chat/ManageMembersModal'
import {
  addSummaryCard,
  endAiRequest,
  selectAiState,
  setSmartReplies,
  setTone,
  startAiRequest,
} from '../../features/ai/aiSlice'
import { summarizeApi } from '../../features/ai/summarizeApi'
import { smartReplyApi } from '../../features/ai/smartReplyApi'
import {
  selectCurrentUser,
  selectIsAdmin,
  selectUserPreferences,
  setPreference,
} from '../../features/auth/authSlice'
import { useAuth } from '../../features/auth/useAuth'
import { commandRegistry } from '../../features/commands/commandRegistry'
import { useCommands } from '../../features/commands/useCommands'
import { useFiles } from '../../features/files/useFiles'
import { addPinnedMessage, addSystemMessage, removeExpiredMessages, selectActiveRoomId, selectMessagesForActiveRoom, selectPinnedIds, selectRooms, selectTypingUsers, setActiveRoom, setRooms, setMessages, sendMessage } from '../../features/messaging/messagingSlice'
import { markAllRead, markRead, selectNotifications, selectUnreadCount } from '../../features/notifications/notifSlice'
import { setCustomStatus, selectPresence, setStatus } from '../../features/presence/presenceSlice'
import { selectPolls, votePoll, createPoll } from '../../features/polls/pollSlice'
import { selectReactionsByMessage } from '../../features/reactions/reactionSlice'
import { closeThread, openThread, selectThreadState } from '../../features/threads/threadSlice'
import { createTempRoom, selectTempRooms } from '../../features/temprooms/tempRoomSlice'
import { useRoomTimer } from '../../features/temprooms/useRoomTimer'
import { setTempRoomMetric } from '../../features/admin/adminSlice'
import { usePresenceSync } from '../../hooks/usePresenceSync'
import { usePushNotif } from '../../hooks/usePushNotif'
import { fetchRooms, fetchMessages, createRoom, joinRoom } from '../../features/messaging/messagingApi'
import { createTemporaryRoomApi } from '../../features/temprooms/tempRoomApi'
import { useMessagingSocket } from '../../hooks/useMessagingSocket'

function reorderIds(list, draggedId, targetId) {
  const withoutDragged = list.filter((item) => item !== draggedId)
  const targetIndex = withoutDragged.indexOf(targetId)
  if (targetIndex === -1) {
    return [...withoutDragged, draggedId]
  }

  withoutDragged.splice(targetIndex, 0, draggedId)
  return withoutDragged
}

function createFallbackProfile(id, name, overrides = {}) {
  return {
    id,
    name,
    role: 'Member',
    team: 'Core Team',
    status: 'Active',
    bio: 'Collaborates across rooms and threads inside IntraLink.',
    recentActivity: 'Reviewed updates in the main workspace.',
    ...overrides,
  }
}

function ChatPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { bookmarks, saveBookmark } = useFiles()

  const user = useSelector(selectCurrentUser)
  const isAdmin = useSelector(selectIsAdmin)
  const preferences = useSelector(selectUserPreferences)

  const rooms = useSelector(selectRooms)
  const activeRoomId = useSelector(selectActiveRoomId)
  const messages = useSelector(selectMessagesForActiveRoom)
  const messagesByRoom = useSelector((state) => state.messaging.messagesByRoom)
  const typingUsers = useSelector(selectTypingUsers)
  const pinnedIds = useSelector(selectPinnedIds)

  const tempRooms = useSelector(selectTempRooms)
  const threadState = useSelector(selectThreadState)
  const reactionsByMessage = useSelector(selectReactionsByMessage)

  const notifications = useSelector(selectNotifications)
  const unreadCount = useSelector(selectUnreadCount)
  const presence = useSelector(selectPresence)
  const aiState = useSelector(selectAiState)
  const polls = useSelector(selectPolls)

  const { permission, askPermission } = usePushNotif()

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [globalSearchQuery, setGlobalSearchQuery] = useState('')
  const deferredGlobalSearchQuery = useDeferredValue(globalSearchQuery)
  const [showNotifications, setShowNotifications] = useState(false)
  const [toast, setToast] = useState(null)
  const [showPollModal, setShowPollModal] = useState(false)
  const [showGlobalSearch, setShowGlobalSearch] = useState(false)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState({
    favorites: false,
    rooms: false,
    recent: false,
    tempRooms: false,
    commandHistory: false,
  })
  const [favoriteRoomIds, setFavoriteRoomIds] = useState([])
  const [recentRoomIds, setRecentRoomIds] = useState([])
  const [commandHistory, setCommandHistory] = useState(['/help', '/summarize standard'])
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedMessageIds, setSelectedMessageIds] = useState([])
  const [smartRepliesDismissed, setSmartRepliesDismissed] = useState(false)
  const [threadWidth, setThreadWidth] = useState(360)
  const [isThreadResizing, setIsThreadResizing] = useState(false)
  const [lastReadByRoom, setLastReadByRoom] = useState({})

  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showManageMembers, setShowManageMembers] = useState(false)
  const [showJumpToLatest, setShowJumpToLatest] = useState(false)
  const [draggedRoomId, setDraggedRoomId] = useState(null)
  const [roomOrder, setRoomOrder] = useState(() =>
    rooms.filter((room) => room.type !== 'temporary').map((room) => room.id),
  )
  const chatScrollRef = useRef(null)
  const previousRoomRef = useRef(activeRoomId)

  const { socket } = useMessagingSocket()

  useEffect(() => {
    async function load() {
      if (user) {
        const data = await fetchRooms()
        dispatch(setRooms(data))
      }
    }
    load()
  }, [user, dispatch])

  useEffect(() => {
    async function loadMsgs() {
      if (activeRoomId && socket) {
        const data = await fetchMessages(activeRoomId)
        dispatch(setMessages({ roomId: activeRoomId, messages: data }))
        socket.emit('join_room', { room_id: activeRoomId })
      }
    }
    loadMsgs()
  }, [activeRoomId, dispatch, socket])

  useRoomTimer()
  usePresenceSync()

  useEffect(() => {
    const interval = setInterval(() => {
      dispatch(removeExpiredMessages())
    }, 1000)

    return () => clearInterval(interval)
  }, [dispatch])

  useEffect(() => {
    dispatch(setTempRoomMetric(tempRooms.filter((room) => !room.locked).length))
  }, [dispatch, tempRooms])

  useEffect(() => {
    const onKeyDown = (event) => {
      const usingModifier = event.ctrlKey || event.metaKey

      if (usingModifier && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setShowCommandPalette(true)
      }

      if (usingModifier && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        setShowGlobalSearch(true)
      }

      if (event.key === '?' && !usingModifier) {
        const tagName = document.activeElement?.tagName
        if (tagName !== 'INPUT' && tagName !== 'TEXTAREA') {
          event.preventDefault()
          setShowShortcuts(true)
        }
      }

      if (event.key === 'Escape') {
        setShowCommandPalette(false)
        setShowGlobalSearch(false)
        setShowShortcuts(false)
        setShowNotifications(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!isThreadResizing) {
      return undefined
    }

    const handleMove = (event) => {
      const nextWidth = Math.max(300, Math.min(560, window.innerWidth - event.clientX))
      setThreadWidth(nextWidth)
    }

    const handleUp = () => setIsThreadResizing(false)

    window.addEventListener('mousemove', handleMove)
    window.addEventListener('mouseup', handleUp)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      window.removeEventListener('mouseup', handleUp)
    }
  }, [isThreadResizing])

  useEffect(() => {
    const roomChanged = previousRoomRef.current !== activeRoomId
    previousRoomRef.current = activeRoomId

    if (chatScrollRef.current && (roomChanged || !showJumpToLatest)) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [activeRoomId, messages.length, showJumpToLatest])

  const activeTempRoom = useMemo(
    () => tempRooms.find((room) => room.roomId === activeRoomId),
    [activeRoomId, tempRooms],
  )

  const roomIsLocked = Boolean(activeTempRoom?.locked)

  const filteredMessages = useMemo(() => {
    if (!deferredSearch.trim()) {
      return messages
    }

    const query = deferredSearch.toLowerCase()
    return messages.filter((message) => message.text.toLowerCase().includes(query))
  }, [deferredSearch, messages])

  const pinnedMessages = useMemo(
    () => messages.filter((message) => pinnedIds.includes(message.id)),
    [messages, pinnedIds],
  )

  const currentRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId) ?? tempRooms.find((room) => room.roomId === activeRoomId),
    [activeRoomId, rooms, tempRooms],
  )

  const isMember = useMemo(() => {
    if (isAdmin) return true
    if (!currentRoom) return false
    return currentRoom.members?.some((m) => m.user_id === user?.id)
  }, [currentRoom, user, isAdmin])

  const userDirectory = useMemo(() => {
    const profiles = {
      system: createFallbackProfile('system', 'System', {
        role: 'Automation',
        team: 'Platform',
        bio: 'Posts room notices, expiry messages, and system automation events.',
        recentActivity: 'Created an automated system announcement.',
      }),
    }

    if (user) {
      profiles[user.id] = createFallbackProfile(user.id, user.name ?? 'You', {
        role: isAdmin ? 'Admin' : 'User',
        team: isAdmin ? 'Operations' : 'Product',
        status: presence.currentStatus,
        bio: 'Your local demo profile for frontend-only interaction flows.',
        recentActivity: 'Composed a message draft in the current room.',
      })
    }

    presence.users.forEach((presenceUser) => {
      profiles[presenceUser.id] = createFallbackProfile(presenceUser.id, presenceUser.name, {
        status: presenceUser.status,
        role: 'Engineer',
        team: 'Platform',
        recentActivity: `${presenceUser.name} updated presence recently.`,
      })
    })

    Object.values(messagesByRoom)
      .flat()
      .forEach((message) => {
        if (!profiles[message.authorId]) {
          profiles[message.authorId] = createFallbackProfile(message.authorId, message.authorName, {
            team: 'Workspace',
            recentActivity: `Last active in ${currentRoom?.name ?? 'chat'}.`,
          })
        }
      })

    return profiles
  }, [currentRoom?.name, isAdmin, messagesByRoom, presence, user])

  const roomSignals = useMemo(() => {
    return rooms.reduce((accumulator, room) => {
      const roomMessages = messagesByRoom[room.id] ?? []
      const unreadCount = roomMessages.filter(
        (message) => message.timestamp > (lastReadByRoom[room.id] ?? 0),
      ).length
      const mentionCount = roomMessages.filter((message) =>
        user?.name ? message.text.toLowerCase().includes(`@${user.name.toLowerCase()}`) : false,
      ).length
      const threadCount = roomMessages.reduce((sum, message) => sum + (message.threadCount ?? 0), 0)
      accumulator[room.id] = { unreadCount, mentionCount, threadCount }
      return accumulator
    }, {})
  }, [lastReadByRoom, messagesByRoom, rooms, user?.name])

  const favoriteRooms = useMemo(
    () => rooms.filter((room) => favoriteRoomIds.includes(room.id) && room.type !== 'temporary'),
    [favoriteRoomIds, rooms],
  )

  const recentRooms = useMemo(
    () => recentRoomIds.map((roomId) => rooms.find((room) => room.id === roomId)).filter(Boolean),
    [recentRoomIds, rooms],
  )

  const orderedRooms = useMemo(() => {
    const standardRooms = rooms.filter((room) => room.type !== 'temporary')
    return roomOrder.map((roomId) => standardRooms.find((room) => room.id === roomId)).filter(Boolean)
  }, [roomOrder, rooms])

  const activeThreadItems = useMemo(() => {
    if (!threadState.parentMessage) {
      return []
    }

    return threadState.byParent[threadState.parentMessage.id] ?? []
  }, [threadState.byParent, threadState.parentMessage])

  useQuery({
    queryKey: ['smart-replies', activeRoomId, aiState.tone, messages.at(-1)?.id],
    queryFn: async () => smartReplyApi({ messages: messages.slice(-5), tone: aiState.tone }),
    enabled: preferences.smartRepliesEnabled && messages.length > 0,
    staleTime: 15000,
    onSuccess: (data) => {
      dispatch(setSmartReplies(data))
    },
  })

  const firstUnreadMessageId = useMemo(() => {
    const cutoff = lastReadByRoom[activeRoomId] ?? 0
    return filteredMessages.find((message) => message.timestamp > cutoff)?.id ?? null
  }, [activeRoomId, filteredMessages, lastReadByRoom])

  const selectedMessages = useMemo(
    () => messages.filter((message) => selectedMessageIds.includes(message.id)),
    [messages, selectedMessageIds],
  )

  const searchResults = useMemo(() => {
    const query = deferredGlobalSearchQuery.trim().toLowerCase()
    if (!query) {
      return {
        rooms: [],
        messages: [],
        bookmarks: [],
        people: [],
      }
    }

    const roomResults = rooms
      .filter((room) => room.name.toLowerCase().includes(query))
      .map((room) => ({
        id: `room-${room.id}`,
        roomId: room.id,
        label: `#${room.name}`,
        meta: room.type === 'temporary' ? 'Temporary room' : 'Standard room',
        type: 'room',
      }))

    const messageResults = Object.entries(messagesByRoom)
      .flatMap(([roomId, roomMessages]) =>
        roomMessages
          .filter((message) => message.text.toLowerCase().includes(query))
          .map((message) => ({
            id: `message-${message.id}`,
            roomId,
            label: message.text,
            meta: `Message in #${roomId.replace('room-', '')}`,
            type: 'message',
          })),
      )
      .slice(0, 8)

    const bookmarkResults = bookmarks
      .filter((bookmark) =>
        `${bookmark.text} ${(bookmark.tags ?? []).join(' ')} ${bookmark.note ?? ''}`
          .toLowerCase()
          .includes(query),
      )
      .map((bookmark) => ({
        id: `bookmark-${bookmark.id}`,
        roomId: bookmark.roomId,
        label: bookmark.text,
        meta: `Bookmark · ${(bookmark.tags ?? []).join(', ') || 'untagged'}`,
        type: 'bookmark',
      }))

    const peopleResults = Object.values(userDirectory)
      .filter((profile) => `${profile.name} ${profile.team} ${profile.role}`.toLowerCase().includes(query))
      .map((profile) => ({
        id: `profile-${profile.id}`,
        label: profile.name,
        meta: `${profile.role} · ${profile.team}`,
        type: 'profile',
      }))

    return {
      rooms: roomResults,
      messages: messageResults,
      bookmarks: bookmarkResults,
      people: peopleResults,
    }
  }, [bookmarks, deferredGlobalSearchQuery, messagesByRoom, rooms, userDirectory])

  const paletteItems = useMemo(() => {
    const navigationItems = [
      {
        id: 'palette-global-search',
        label: 'Open global search',
        description: 'Search rooms, messages, bookmarks, and people.',
        action: 'open-search',
        shortcut: 'Ctrl+Shift+F',
      },
      {
        id: 'palette-selection',
        label: selectionMode ? 'Exit selection mode' : 'Enter selection mode',
        description: 'Bulk bookmark, pin, and copy messages.',
        action: 'toggle-selection',
      },
      {
        id: 'palette-shortcuts',
        label: 'Show keyboard shortcuts',
        description: 'Open the keyboard help dialog.',
        action: 'open-shortcuts',
        shortcut: '?',
      },
      ...commandHistory.slice(0, 4).map((command, index) => ({
        id: `palette-recent-command-${index}`,
        label: command,
        description: 'Recent command',
        action: 'run-command',
        value: command,
      })),
      ...orderedRooms.map((room) => ({
        id: `palette-room-${room.id}`,
        label: `Jump to #${room.name}`,
        description: 'Switch active room',
        action: 'goto-room',
        roomId: room.id,
      })),
      ...commandRegistry.map((command) => ({
        id: `palette-command-${command.name}`,
        label: command.name,
        description: command.description,
        action: 'run-command',
        value: command.name,
      })),
    ]

    if (isAdmin) {
      navigationItems.unshift({
        id: 'palette-admin-dashboard',
        label: 'Open admin dashboard',
        description: 'Go to the analytics dashboard.',
        action: 'navigate',
        path: '/admin/dashboard',
      })
    }

    return navigationItems
  }, [commandHistory, isAdmin, orderedRooms, selectionMode])

  const commandExecutor = useCommands({
    help: () => {
      dispatch(
        addSystemMessage({
          roomId: activeRoomId,
          text: 'Commands: /join /leave /create-room /create-temp-room [name] [duration] /whisper [user] [message] /summarize [brief|standard|detailed]',
        }),
      )
    },
    summarize: async (args) => {
      const depth = ['brief', 'standard', 'detailed'].includes(args[0]) ? args[0] : 'standard'
      dispatch(startAiRequest())

      try {
        const summary = await summarizeApi({ messages, depth })
        dispatch(
          addSummaryCard({
            depth,
            ...summary,
          }),
        )
      } finally {
        dispatch(endAiRequest())
      }
    },
    'create-temp-room': async (args) => {
      const name = args[0] ?? `temp-room-${Date.now().toString().slice(-4)}`
      const duration = args[1] ?? '1h'

      try {
        const newTemp = await createTemporaryRoomApi({ name, duration })
        dispatch(
          addSystemMessage({
            roomId: activeRoomId,
            text: `Temporary room "${name}" created for ${duration}. ID: ${newTemp.id}`,
          }),
        )
        // Refetch full room list
        const latestRooms = await fetchRooms()
        dispatch(setRooms(latestRooms))
      } catch (err) {
        setToast({ type: 'error', message: err.response?.data?.detail || 'Failed to create temp room' })
      }
    },
    whisper: (args) => {
      const target = args[0]
      const body = args.slice(1).join(' ')

      dispatch(
        addSystemMessage({
          roomId: activeRoomId,
          text: target && body ? `Whisper to @${target}: ${body} (Note: Direct messaging UI not fully bound yet)` : 'Usage: /whisper [user] [message]',
        }),
      )
    },
    join: async (args) => {
      const roomId = args[0]
      if (!roomId) {
        setToast({ type: 'warning', message: 'Usage: /join [room_id]' })
        return
      }
      try {
        await joinRoom(roomId)
        setToast({ type: 'info', message: 'Joined room.' })
        // Refetch full room list
        const latestRooms = await fetchRooms()
        dispatch(setRooms(latestRooms))
      } catch (err) {
         setToast({ type: 'error', message: err.response?.data?.detail || 'Failed to join room' })
      }
    },
    leave: () => {
      dispatch(
        addSystemMessage({
          roomId: activeRoomId,
          text: 'Leaving current room is not fully supported via chat slash command yet.',
        }),
      )
    },
    'create-room': async (args) => {
      const roomName = args[0] ?? 'new-room'
      try {
        await createRoom({ name: roomName, description: '', type: 'standard' })
        setToast({ type: 'info', message: 'Room created successfully.' })
        const latestRooms = await fetchRooms()
        dispatch(setRooms(latestRooms))
      } catch (err) {
        setToast({ type: 'error', message: err.response?.data?.detail || 'Failed to create room' })
      }
    },
  })

  const toggleSidebarSection = (section) => {
    setCollapsedSections((current) => ({
      ...current,
      [section]: !current[section],
    }))
  }

  const markRoomRead = (roomId) => {
    setLastReadByRoom((current) => ({
      ...current,
      [roomId]: Date.now(),
    }))
  }

  const handleSelectRoom = (roomId) => {
    dispatch(setActiveRoom(roomId))
    setSelectedMessageIds([])
    setSelectionMode(false)
    setSmartRepliesDismissed(false)
    startTransition(() => {
      setRecentRoomIds((current) => [roomId, ...current.filter((item) => item !== roomId)].slice(0, 6))
    })

    if (!lastReadByRoom[roomId]) {
      setLastReadByRoom((current) => ({
        ...current,
        [roomId]: Date.now() - 1000 * 60 * 4,
      }))
    }
  }

  const handleToggleFavoriteRoom = (roomId) => {
    setFavoriteRoomIds((current) =>
      current.includes(roomId) ? current.filter((item) => item !== roomId) : [...current, roomId],
    )
  }

  const handleRoomDrop = (targetRoomId) => {
    if (!draggedRoomId || draggedRoomId === targetRoomId) {
      return
    }
    setRoomOrder((current) => reorderIds(current, draggedRoomId, targetRoomId))
    setDraggedRoomId(null)
  }

  const handlePaletteSelect = (item) => {
    setShowCommandPalette(false)

    if (item.action === 'open-search') {
      setShowGlobalSearch(true)
      return
    }

    if (item.action === 'open-shortcuts') {
      setShowShortcuts(true)
      return
    }

    if (item.action === 'toggle-selection') {
      setSelectionMode((current) => !current)
      setSelectedMessageIds([])
      return
    }

    if (item.action === 'goto-room') {
      handleSelectRoom(item.roomId)
      return
    }

    if (item.action === 'navigate') {
      navigate(item.path)
      return
    }

    if (item.action === 'run-command') {
      handleSendMessage(item.value)
    }
  }

  const handleSendMessage = (text) => {
    if (text.startsWith('/')) {
      startTransition(() => {
        setCommandHistory((current) => [text, ...current.filter((item) => item !== text)].slice(0, 8))
      })

      const handled = commandExecutor(text)
      if (!handled) {
        dispatch(
          addSystemMessage({
            roomId: activeRoomId,
            text: 'Unknown command. Use /help.',
          }),
        )
        setToast({ type: 'warning', message: 'Unknown command. Try /help.' })
      }
      return
    }

    if (roomIsLocked) {
      setToast({ type: 'warning', message: 'Room expired. Messaging is disabled.' })
      return
    }

    if (socket) {
      dispatch(
        sendMessage({
          roomId: activeRoomId,
          text,
          authorName: user?.name ?? 'You',
          authorId: user?.id ?? 'local',
        })
      )
      socket.emit('send_message', { room_id: activeRoomId, text })
    }

    setToast({ type: 'info', message: 'Message sent.' })
  }

  const handleReact = (messageId, emoji) => {
    if (socket) {
      socket.emit('toggle_reaction', { message_id: messageId, emoji })
    }
  }

  const handleSaveBookmark = (message) => {
    saveBookmark({
      roomId: activeRoomId,
      text: message.text,
      tags: [currentRoom?.name ?? 'room', message.isSystem ? 'system' : 'message'],
      note: '',
    })
    setToast({ type: 'info', message: 'Message saved to bookmarks.' })
  }

  const handlePinMessage = (message) => {
    dispatch(addPinnedMessage({ roomId: activeRoomId, messageId: message.id }))
    setToast({ type: 'info', message: 'Pinned to this channel.' })
  }

  const handleOpenThread = (message) => {
    dispatch(openThread(message))
  }

  const handleReplyInThread = (text) => {
    if (!threadState.parentMessage || !socket) {
      return
    }

    const parentId = threadState.parentMessage.id
    socket.emit('thread_reply', { parent_message_id: parentId, text })
  }

  const handleCreatePoll = (payload) => {
    dispatch(createPoll(payload))
  }

  const handleToggleSelection = (messageId) => {
    setSelectedMessageIds((current) =>
      current.includes(messageId)
        ? current.filter((item) => item !== messageId)
        : [...current, messageId],
    )
  }

  const handleCopySelected = async () => {
    const content = selectedMessages.map((message) => `${message.authorName}: ${message.text}`).join('\n')
    if (!content) {
      return
    }

    await navigator.clipboard.writeText(content)
    setToast({ type: 'info', message: 'Selected messages copied.' })
  }

  const handleBookmarkSelected = () => {
    selectedMessages.forEach((message) => {
      saveBookmark({
        roomId: activeRoomId,
        text: message.text,
        tags: ['bulk-save', currentRoom?.name ?? 'room'],
        note: '',
      })
    })
    setToast({ type: 'info', message: 'Selected messages saved.' })
  }

  const handlePinSelected = () => {
    selectedMessages.forEach((message) => {
      dispatch(addPinnedMessage({ roomId: activeRoomId, messageId: message.id }))
    })
    setToast({ type: 'info', message: 'Selected messages pinned.' })
  }

  const handleChatScroll = () => {
    const container = chatScrollRef.current
    if (!container) {
      return
    }

    const nearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 80
    setShowJumpToLatest(!nearBottom)

    if (nearBottom) {
      markRoomRead(activeRoomId)
    }
  }

  const jumpToLatest = () => {
    if (!chatScrollRef.current) {
      return
    }

    chatScrollRef.current.scrollTo({
      top: chatScrollRef.current.scrollHeight,
      behavior: preferences.reducedMotion ? 'auto' : 'smooth',
    })
    markRoomRead(activeRoomId)
    setShowJumpToLatest(false)
  }

  const handleGlobalSearchSelect = (item) => {
    if (item.roomId) {
      handleSelectRoom(item.roomId)
      setSearch(deferredGlobalSearchQuery)
    }

    setShowGlobalSearch(false)
    setGlobalSearchQuery('')
  }

  const pollForRoom = polls.find((poll) => poll.roomId === activeRoomId)

  return (
    <div className="app-page relative flex h-screen flex-col">
      <header className="app-surface flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-slate-900">IntraLink</h1>
          <div className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5 text-sm text-slate-500">
            <Search size={14} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-56 border-none bg-transparent text-sm outline-none"
              placeholder="Filter current room"
            />
          </div>
          <Button variant="secondary" className="text-xs" onClick={() => setShowGlobalSearch(true)}>
            <Search size={14} className="mr-1 inline-flex" />
            Global Search
          </Button>
        </div>

        <div className="flex items-center gap-3">
          {permission !== 'granted' ? (
            <Button variant="secondary" className="text-xs" onClick={askPermission}>
              Enable Push
            </Button>
          ) : null}

          <button
            type="button"
            className="relative inline-flex items-center gap-2 rounded-md border border-slate-200 px-2 py-1.5 text-sm"
            onClick={() => setShowNotifications((value) => !value)}
          >
            <Bell size={16} />
            <UnreadBadge count={unreadCount} />
          </button>

          <Button variant="ghost" className="text-xs" onClick={() => setShowCommandPalette(true)}>
            <Command size={14} className="mr-1 inline-flex" />
            Palette
          </Button>

          <Button variant="ghost" className="text-xs" onClick={() => setShowShortcuts(true)}>
            <Keyboard size={14} className="mr-1 inline-flex" />
            Shortcuts
          </Button>

          <Avatar name={user?.name ?? 'User'} />
          <Button variant="ghost" className="text-xs" onClick={signOut}>
            Logout
          </Button>
        </div>
      </header>

      {showNotifications ? (
        <NotificationCenter
          items={notifications}
          onRead={(id) => dispatch(markRead(id))}
          onReadAll={() => dispatch(markAllRead())}
          onClose={() => setShowNotifications(false)}
        />
      ) : null}

      <SearchOverlay
        open={showGlobalSearch}
        query={globalSearchQuery}
        onQueryChange={setGlobalSearchQuery}
        results={searchResults}
        onClose={() => setShowGlobalSearch(false)}
        onSelect={handleGlobalSearchSelect}
      />

      <CommandPalette
        open={showCommandPalette}
        items={paletteItems}
        recentCommands={commandHistory}
        onClose={() => setShowCommandPalette(false)}
        onSelect={handlePaletteSelect}
      />

      <ShortcutModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />

      <div className="flex min-h-0 flex-1">
        <aside className="app-surface w-80 overflow-y-auto border-r p-3">
          <div className="mb-4 space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Navigation</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <Link to="/user/bookmarks" className="rounded border border-slate-200 p-2 text-center">
                Bookmarks
              </Link>
              <Link to="/user/preferences" className="rounded border border-slate-200 p-2 text-center">
                Preferences
              </Link>
              <Link to="/manager/dashboard" className="rounded border border-slate-200 p-2 text-center">
                Managed Rooms
              </Link>
              {isAdmin ? (
                <Link
                  to="/admin/dashboard"
                  className="rounded border border-slate-200 p-2 text-center"
                >
                  Admin Dash
                </Link>
              ) : null}
            </div>
          </div>

          <SidebarSection
            title="Favorites"
            count={favoriteRooms.length}
            collapsed={collapsedSections.favorites}
            onToggle={() => toggleSidebarSection('favorites')}
          >
            <div className="space-y-2">
              {favoriteRooms.length ? (
                favoriteRooms.map((room) => (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => handleSelectRoom(room.id)}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                      activeRoomId === room.id
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    <span>#{room.name}</span>
                    <Star size={14} className="fill-current" />
                  </button>
                ))
              ) : (
                <EmptyState
                  title="No favorite rooms"
                  description="Star rooms from the full list to pin your most-used spaces here."
                />
              )}
            </div>
          </SidebarSection>

          <SidebarSection
            title="Rooms"
            count={orderedRooms.length}
            collapsed={collapsedSections.rooms}
            onToggle={() => toggleSidebarSection('rooms')}
            actionIcon={isAdmin ? <Plus size={14} onClick={(e) => { e.stopPropagation(); setShowCreateRoom(true); }} /> : null}
          >
            <div className="space-y-2">
              {orderedRooms.map((room) => (
                <div
                  key={room.id}
                  draggable
                  onDragStart={() => setDraggedRoomId(room.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleRoomDrop(room.id)}
                  className={`rounded-md border ${
                    activeRoomId === room.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="flex items-center gap-2 px-3 py-2">
                    <button
                      type="button"
                      onClick={() => handleSelectRoom(room.id)}
                      className="flex flex-1 items-center justify-between text-left text-sm"
                    >
                      <span>#{room.name}</span>
                      <div className="flex items-center gap-1 text-[11px]">
                        {roomSignals[room.id]?.mentionCount ? (
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-800">
                            @{roomSignals[room.id].mentionCount}
                          </span>
                        ) : null}
                        {roomSignals[room.id]?.unreadCount ? (
                          <span className="rounded-full bg-sky-100 px-1.5 py-0.5 text-sky-800">
                            {roomSignals[room.id].unreadCount}
                          </span>
                        ) : null}
                        {roomSignals[room.id]?.threadCount ? (
                          <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-slate-700">
                            T{roomSignals[room.id].threadCount}
                          </span>
                        ) : null}
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleFavoriteRoom(room.id)}
                      className="text-xs"
                    >
                      <Star size={14} className={favoriteRoomIds.includes(room.id) ? 'fill-current' : ''} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </SidebarSection>

          <SidebarSection
            title="Recent"
            count={recentRooms.length}
            collapsed={collapsedSections.recent}
            onToggle={() => toggleSidebarSection('recent')}
          >
            <div className="space-y-2">
              {recentRooms.map((room) => (
                <button
                  key={room.id}
                  type="button"
                  onClick={() => handleSelectRoom(room.id)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700"
                >
                  #{room.name}
                </button>
              ))}
            </div>
          </SidebarSection>

          <SidebarSection
            title="Temporary Rooms"
            count={tempRooms.length}
            collapsed={collapsedSections.tempRooms}
            onToggle={() => toggleSidebarSection('tempRooms')}
          >
            <div className="space-y-2">
              {tempRooms.length ? (
                tempRooms.map((room) => (
                  <button
                    key={room.id}
                    className="w-full text-left"
                    onClick={() => handleSelectRoom(room.roomId)}
                    type="button"
                  >
                    <TempRoomBadge room={room} />
                  </button>
                ))
              ) : (
                <EmptyState
                  title="No temporary rooms"
                  description="Use /create-temp-room to spin up a time-boxed workspace."
                />
              )}
            </div>
          </SidebarSection>

          <SidebarSection
            title="Command History"
            count={commandHistory.length}
            collapsed={collapsedSections.commandHistory}
            onToggle={() => toggleSidebarSection('commandHistory')}
          >
            <div className="space-y-2">
              {commandHistory.map((command, index) => (
                <button
                  key={`${command}-${index}`}
                  type="button"
                  onClick={() => handleSendMessage(command)}
                  className="w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-left text-xs text-slate-600"
                >
                  {command}
                </button>
              ))}
            </div>
          </SidebarSection>

          <StatusIndicator status={presence.currentStatus} customStatus={presence.customStatus} />
          <div className="mt-2">
            <StatusPicker
              status={presence.currentStatus}
              onStatusChange={(status) => dispatch(setStatus(status))}
              onCustomStatusChange={(text) => dispatch(setCustomStatus(text))}
            />
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col p-3">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-slate-500">Channel</p>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                #{currentRoom?.name ?? activeRoomId?.replace('room-', '') ?? 'select-room'}
                {!roomIsLocked && 
                  (isAdmin || currentRoom?.members?.find(m => m.user_id === user?.id)?.room_role === 'room_manager') && (
                  <button 
                    onClick={() => setShowManageMembers(true)}
                    className="text-slate-400 hover:text-cyan-600 transition-colors ml-2"
                    title="Manage Members"
                  >
                    <UserPlus size={16} />
                  </button>
                )}
              </h2>
              <p className="text-xs text-slate-500">
                {roomSignals[activeRoomId]?.unreadCount ?? 0} unread · {roomSignals[activeRoomId]?.threadCount ?? 0} threaded replies
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" className="text-xs" onClick={() => setShowPollModal(true)}>
                Create Poll
              </Button>
              <Button
                variant={selectionMode ? 'primary' : 'secondary'}
                className="text-xs"
                onClick={() => {
                  setSelectionMode((current) => !current)
                  setSelectedMessageIds([])
                }}
              >
                {selectionMode ? 'Exit Selection' : 'Selection Mode'}
              </Button>
              <Button variant="ghost" className="text-xs" onClick={() => markRoomRead(activeRoomId)}>
                Mark Read
              </Button>
            </div>
          </div>

          {roomIsLocked ? <RoomExpiredBanner /> : null}

          {selectionMode ? (
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <span className="text-sm text-slate-700">{selectedMessageIds.length} messages selected</span>
              <div className="flex flex-wrap gap-2">
                <Button variant="secondary" className="text-xs" onClick={handleBookmarkSelected}>
                  Bookmark Selected
                </Button>
                <Button variant="secondary" className="text-xs" onClick={handlePinSelected}>
                  Pin Selected
                </Button>
                <Button variant="ghost" className="text-xs" onClick={handleCopySelected}>
                  Copy Selected
                </Button>
                <Button variant="ghost" className="text-xs" onClick={() => setSelectedMessageIds([])}>
                  Clear
                </Button>
              </div>
            </div>
          ) : null}

          {pinnedMessages.length ? (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white p-2">
              <span className="text-xs font-semibold text-slate-500">Pinned</span>
              {pinnedMessages.map((message) => (
                <span key={message.id} className="rounded-full border border-slate-200 px-2 py-1 text-xs">
                  {message.text}
                </span>
              ))}
            </div>
          ) : null}

          {aiState.loading ? (
            <div className="mb-3 space-y-2 rounded-md border border-slate-200 bg-white p-3">
              <SkeletonBlock className="h-4 w-1/3" />
              <SkeletonBlock className="h-3 w-full" />
              <SkeletonBlock className="h-3 w-5/6" />
            </div>
          ) : null}

          {aiState.summaryCards.length ? (
            <div className="mb-3 space-y-2">
              {aiState.summaryCards.map((summary) => (
                <details key={summary.id} className="rounded-md border border-slate-200 bg-white p-3">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-800">
                    AI Summary · {summary.depth}
                  </summary>
                  <div className="mt-2 space-y-2 text-sm text-slate-700">
                    <div>
                      <p className="font-semibold">Key Decisions</p>
                      <ul className="list-disc pl-5">
                        {summary.decisions.map((decision, index) => (
                          <li key={`${summary.id}-decision-${index}`}>{decision}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold">Action Items</p>
                      <ul className="list-disc pl-5">
                        {summary.actionItems.map((item, index) => (
                          <li key={`${summary.id}-action-${index}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold">Mentions</p>
                      <p>{summary.mentions.length ? summary.mentions.join(', ') : 'No mentions extracted'}</p>
                    </div>
                  </div>
                </details>
              ))}
            </div>
          ) : null}

          {pollForRoom ? (
            <div className="mb-3">
              <PollCard poll={pollForRoom} onVote={(pollId, optionId) => dispatch(votePoll({ pollId, optionId }))} />
            </div>
          ) : null}

          <ChatWindow
            messages={filteredMessages}
            reactionsByMessage={reactionsByMessage}
            onReact={handleReact}
            onOpenThread={handleOpenThread}
            selectionMode={selectionMode}
            selectedMessageIds={selectedMessageIds}
            onToggleSelect={handleToggleSelection}
            searchQuery={search}
            userDirectory={userDirectory}
            firstUnreadMessageId={firstUnreadMessageId}
            scrollRef={chatScrollRef}
            onScroll={handleChatScroll}
            onSaveBookmark={handleSaveBookmark}
            onPinMessage={handlePinMessage}
          />

          {showJumpToLatest ? (
            <div className="pointer-events-none fixed bottom-24 right-8 z-20">
              <Button className="pointer-events-auto shadow-lg" onClick={jumpToLatest}>
                <ArrowDownCircle size={16} className="mr-1 inline-flex" />
                Jump to latest
              </Button>
            </div>
          ) : null}

          <div className="mt-2">
            <TypingIndicator users={typingUsers} />
          </div>

          <div className="mt-2">
            <MessageInput
              key={activeRoomId}
              roomId={activeRoomId}
              disabled={roomIsLocked}
              unauthorized={!isMember}
              onSend={handleSendMessage}
              smartReplies={aiState.smartReplies}
              tone={preferences.tone}
              onToneChange={(nextTone) => {
                dispatch(setPreference({ key: 'tone', value: nextTone }))
                dispatch(setTone(nextTone))
              }}
              smartRepliesDismissed={smartRepliesDismissed}
              onDismissSmartReplies={() => setSmartRepliesDismissed(true)}
              onRestoreSmartReplies={() => setSmartRepliesDismissed(false)}
              onOpenCommandPalette={() => setShowCommandPalette(true)}
              commandHistory={commandHistory}
            />
          </div>
        </section>

        {threadState.isOpen ? (
          <div className="flex bg-slate-50" style={{ width: `${threadWidth}px` }}>
            <div
              className="w-1 cursor-col-resize bg-transparent transition hover:bg-slate-300"
              onMouseDown={() => setIsThreadResizing(true)}
            />
            <ThreadPanel
              open={threadState.isOpen}
              parentMessage={threadState.parentMessage}
              items={activeThreadItems}
              onClose={() => dispatch(closeThread())}
              onReply={handleReplyInThread}
              disabled={roomIsLocked}
            />
          </div>
        ) : null}
      </div>

      <PollModal
        open={showPollModal}
        onClose={() => setShowPollModal(false)}
        onCreate={handleCreatePoll}
        roomId={activeRoomId}
      />
      <Toast message={toast?.message} type={toast?.type} />
    </div>
  )
}

export default ChatPage