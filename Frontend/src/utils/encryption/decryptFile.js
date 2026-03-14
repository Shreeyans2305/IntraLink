export async function decryptFile(encryptedPayload) {
  const { encrypted, iv, key } = encryptedPayload
  const decrypted = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    encrypted,
  )

  return decrypted
}