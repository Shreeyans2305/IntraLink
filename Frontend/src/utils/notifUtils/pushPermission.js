export function pushPermission() {
  if (typeof Notification === 'undefined') {
    return 'unsupported'
  }

  return Notification.permission
}