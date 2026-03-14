export function encryptExport(serialized) {
  return btoa(unescape(encodeURIComponent(serialized)))
}