import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSocket } from './useSocket'
import { receiveMessage, setThreadCount, setTypingUsers } from '../features/messaging/messagingSlice'
import { setReactions } from '../features/reactions/reactionSlice'
import { receiveThreadReply } from '../features/threads/threadSlice'
import { updatePoll, createPoll, closePoll } from '../features/polls/pollSlice'
import { selectCurrentUser } from '../features/auth/authSlice'
import { addNotification } from '../features/notifications/notifSlice'

export function useMessagingSocket() {
  const dispatch = useDispatch()
  const currentUser = useSelector(selectCurrentUser)
  const { socket, connected } = useSocket({ autoConnect: true })

  useEffect(() => {
    if (!socket || !connected) return

    const handleNewMessage = (msg) => {
      dispatch(receiveMessage({
        roomId: msg.room_id,
        id: msg.id || msg._id,
        text: msg.text,
        authorName: msg.author_name,
        authorId: msg.author_id,
        timestamp: msg.timestamp,
        isSystem: msg.is_system,
        threadCount: msg.thread_count,
        expiryAt: msg.expires_at,
      }))

      if (currentUser && msg.text && msg.author_id !== currentUser.id && !msg.is_system) {
        if (msg.text.includes(`@${currentUser.name}`) || msg.text.includes('@everyone')) {
          dispatch(addNotification({
            type: 'Mentions',
            text: `${msg.author_name} mentioned you`,
          }))
        }
      }
    }

    const handleNewWhisper = (msg) => {
      dispatch(receiveMessage({
        roomId: msg.room_id,
        id: msg.id || msg._id,
        text: msg.text,
        authorName: msg.author_name,
        authorId: msg.author_id,
        timestamp: msg.timestamp,
        isSystem: msg.is_system,
        threadCount: msg.thread_count,
        expiryAt: msg.expires_at,
        isWhisper: true,
        targetUsername: msg.target_username,
      }))

      // Notify the recipient when they receive a whisper from someone else
      if (currentUser && msg.author_id !== currentUser.id) {
        dispatch(addNotification({
          type: 'Whispers',
          text: `${msg.author_name} sent you a whisper`,
        }))
      }
    }

    const handleReactionUpdate = (data) => {
      dispatch(setReactions({
        messageId: data.message_id,
        reactions: data.reactions,
      }))
    }

    const handleThreadUpdate = (data) => {
      const reply = data.reply
        ? {
            ...data.reply,
            authorName: data.reply.author_name ?? data.reply.authorName,
            authorId: data.reply.author_id ?? data.reply.authorId,
          }
        : null

      dispatch(receiveThreadReply({
        parentId: data.parent_id,
        reply,
      }))

      if (reply?.room_id && data.parent_id) {
        dispatch(setThreadCount({
          roomId: reply.room_id,
          messageId: data.parent_id,
          threadCount: data.thread_count ?? 0,
        }))
      }
    }

    const handleTypingUsers = (data) => {
      dispatch(setTypingUsers({
        roomId: data.room_id,
        users: data.users,
      }))
    }

    const handlePollUpdate = (data) => {
      dispatch(updatePoll({
        id: data.id || data._id,
        roomId: data.room_id,
        question: data.question,
        options: data.options,
        anonymous: data.anonymous,
        closed: data.closed,
        created_by: data.created_by,
        created_at: data.created_at,
      }))
    }

    const handlePollCreated = (data) => {
      dispatch(createPoll({
        id: data.id || data._id,
        roomId: data.room_id,
        question: data.question,
        options: data.options,
        anonymous: data.anonymous,
        closed: data.closed,
        created_by: data.created_by,
        created_at: data.created_at,
      }))
    }

    const handlePollClosed = (data) => {
      dispatch(closePoll(data.id || data._id))
    }

    const handleSystemMessage = (data) => {
      dispatch(receiveMessage({
        roomId: data.room_id,
        id: `system-${Date.now()}`,
        text: data.text,
        authorName: 'System',
        authorId: 'system',
        timestamp: Date.now(),
        isSystem: true,
        threadCount: 0,
        expiryAt: null,
      }))
    }

    const handleLockdownStatus = (data) => {
      dispatch({ type: 'messaging/setLockdownState', payload: data.active })
    }

    socket.on('new_message', handleNewMessage)
    socket.on('new_whisper', handleNewWhisper)
    socket.on('reaction_update', handleReactionUpdate)
    socket.on('thread_update', handleThreadUpdate)
    socket.on('typing_users', handleTypingUsers)
    socket.on('poll_update', handlePollUpdate)
    socket.on('poll_created', handlePollCreated)
    socket.on('poll_closed', handlePollClosed)
    socket.on('system_message', handleSystemMessage)

    socket.on('lockdown_status', handleLockdownStatus)
    socket.on('lockdown_activated', () => dispatch({ type: 'messaging/setLockdownState', payload: true }))
    socket.on('lockdown_deactivated', () => dispatch({ type: 'messaging/setLockdownState', payload: false }))

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('new_whisper', handleNewWhisper)
      socket.off('reaction_update', handleReactionUpdate)
      socket.off('thread_update', handleThreadUpdate)
      socket.off('typing_users', handleTypingUsers)
      socket.off('poll_update', handlePollUpdate)
      socket.off('poll_created', handlePollCreated)
      socket.off('poll_closed', handlePollClosed)
      socket.off('system_message', handleSystemMessage)
      
      socket.off('lockdown_status', handleLockdownStatus)
      socket.off('lockdown_activated')
      socket.off('lockdown_deactivated')
    }
  }, [dispatch, socket, connected, currentUser?.id, currentUser?.name])

  return { socket, connected }
}
