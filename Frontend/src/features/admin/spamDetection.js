export function spamDetectionScore(messageText) {
  if (!messageText) {
    return 0
  }

  const uppercaseCount = messageText.split('').filter((char) => char === char.toUpperCase()).length
  const linkCount = (messageText.match(/https?:\/\//g) || []).length
  return uppercaseCount + linkCount * 8
}