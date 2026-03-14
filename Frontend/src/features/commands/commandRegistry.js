export const commandRegistry = [
  { name: '/join', description: 'Join a room by name.' },
  { name: '/leave', description: 'Leave the current room.' },
  { name: '/create-room', description: 'Create a standard room.' },
  { name: '/create-temp-room', description: 'Create a temporary room with duration.' },
  { name: '/help', description: 'Show available commands.' },
  { name: '/whisper', description: 'Send a private direct message.' },
  { name: '/summarize', description: 'Generate AI summary: brief/standard/detailed.' },
]

export function isKnownCommand(commandName) {
  return commandRegistry.some((item) => item.name.slice(1) === commandName)
}