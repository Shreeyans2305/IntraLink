export function parseCommand(input) {
  if (!input || !input.startsWith('/')) {
    return null
  }

  const tokens = input.trim().slice(1).split(/\s+/)
  const name = tokens[0]?.toLowerCase()
  const args = tokens.slice(1)

  return {
    name,
    args,
  }
}