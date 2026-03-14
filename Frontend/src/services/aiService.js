const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function summarizeThread({ messages, depth = 'standard' }) {
  await wait(900)

  const recent = messages.slice(-5)
  const mentionMatches = recent
    .flatMap((item) => item.text.match(/@[a-zA-Z0-9_-]+/g) || [])
    .slice(0, 8)

  return {
    depth,
    decisions: recent.slice(0, 2).map((item) => item.text),
    actionItems: recent.slice(2, 4).map((item) => `Follow up: ${item.text}`),
    mentions: mentionMatches,
  }
}

export async function fetchSmartReplies({ messages, tone = 'casual' }) {
  await wait(300)

  const latest = messages[messages.length - 1]?.text ?? 'Thanks for the update.'

  if (tone === 'formal') {
    return [
      `Acknowledged. I will review this shortly.`,
      `Thank you for the details on: "${latest}"`,
      `Noted. Please share any blockers as they arise.`,
    ]
  }

  if (tone === 'technical') {
    return [
      'Can you share logs and repro steps?',
      'I will validate this against staging and update shortly.',
      'Let us track this in a thread with owners and ETA.',
    ]
  }

  return [
    'Sounds good, I can take this.',
    'Got it — give me a few minutes to check.',
    'Thanks for flagging this 👍',
  ]
}