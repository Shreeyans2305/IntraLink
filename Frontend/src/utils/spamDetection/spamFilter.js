export function spamFilter(message) {
  if (!message) {
    return false
  }

  const repeatedChars = /(.)\1{6,}/.test(message)
  const hasSuspiciousLinks = (message.match(/https?:\/\//g) || []).length > 2
  return repeatedChars || hasSuspiciousLinks
}