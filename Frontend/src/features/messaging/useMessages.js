import { useDispatch, useSelector } from 'react-redux'
import {
  selectActiveRoomId,
  selectMessagesForActiveRoom,
  selectRooms,
  selectTypingUsers,
  setActiveRoom,
} from './messagingSlice'

export function useMessages() {
  const dispatch = useDispatch()
  const rooms = useSelector(selectRooms)
  const activeRoomId = useSelector(selectActiveRoomId)
  const messages = useSelector(selectMessagesForActiveRoom)
  const typingUsers = useSelector(selectTypingUsers)

  return {
    rooms,
    activeRoomId,
    messages,
    typingUsers,
    selectRoom: (roomId) => dispatch(setActiveRoom(roomId)),
  }
}