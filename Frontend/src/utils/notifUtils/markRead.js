export function markRead(items, id) {
  return items.map((item) => (item.id === id ? { ...item, read: true } : item))
}