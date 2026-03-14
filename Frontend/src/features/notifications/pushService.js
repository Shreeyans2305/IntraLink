export async function requestPushPermission() {
  if (!('Notification' in window)) {
    return 'unsupported'
  }

  const permission = await Notification.requestPermission()
  return permission
}