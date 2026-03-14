import { useState } from 'react'
import { requestPushPermission } from '../features/notifications/pushService'

export function usePushNotif() {
  const [permission, setPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  )

  const askPermission = async () => {
    const next = await requestPushPermission()
    setPermission(next)
    return next
  }

  return {
    permission,
    askPermission,
  }
}