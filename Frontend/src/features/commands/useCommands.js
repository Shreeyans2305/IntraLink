import { parseCommand } from './commandParser'

export function useCommands(commandHandlers) {
  return (input) => {
    const parsed = parseCommand(input)
    if (!parsed) {
      return false
    }

    const handler = commandHandlers[parsed.name]
    if (handler) {
      handler(parsed.args)
      return true
    }

    return false
  }
}