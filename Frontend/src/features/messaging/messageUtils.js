import DOMPurify from 'dompurify'

export function formatMessageTime(timestamp) {
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function sanitizeMessage(text) {
  return DOMPurify.sanitize(text)
}