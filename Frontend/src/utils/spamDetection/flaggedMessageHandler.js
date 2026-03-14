export function flaggedMessageHandler(message) {
  return {
    ...message,
    flagged: true,
    reason: 'Potential spam pattern',
  }
}