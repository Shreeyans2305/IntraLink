export function archiveRoom(room) {
  return {
    ...room,
    archived: true,
    locked: true,
  }
}