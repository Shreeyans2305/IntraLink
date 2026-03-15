import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { useSocket } from './useSocket'
import { receiveMessage, setThreadCount, setTypingUsers } from '../features/messaging/messagingSlice'
import { setReactions } from '../features/reactions/reactionSlice'
import { receiveThreadReply } from '../features/threads/threadSlice'
import { updatePoll } from '../features/polls/pollSlice'

export function useMessagingSocket() {
  const dispatch = useDispatch()
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
      dispatch(updatePoll(data))
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

    socket.on('new_message', handleNewMessage)
    socket.on('reaction_update', handleReactionUpdate)
    socket.on('thread_update', handleThreadUpdate)
    socket.on('typing_users', handleTypingUsers)
    socket.on('poll_update', handlePollUpdate)
    socket.on('system_message', handleSystemMessage)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('reaction_update', handleReactionUpdate)
      socket.off('thread_update', handleThreadUpdate)
      socket.off('typing_users', handleTypingUsers)
      socket.off('poll_update', handlePollUpdate)
      socket.off('system_message', handleSystemMessage)
    }
  }, [dispatch, socket, connected])

  return { socket, connected }
}
