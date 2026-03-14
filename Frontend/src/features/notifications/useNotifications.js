import { useDispatch, useSelector } from 'react-redux'
import {
  markAllRead,
  markRead,
  selectNotifications,
  selectUnreadCount,
} from './notifSlice'

export function useNotifications() {
  const dispatch = useDispatch()
  const notifications = useSelector(selectNotifications)
  const unreadCount = useSelector(selectUnreadCount)

  return {
    notifications,
    unreadCount,
    setRead: (id) => dispatch(markRead(id)),
    setAllRead: () => dispatch(markAllRead()),
  }
}