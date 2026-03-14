import { generateSymmetricKey } from './keyManager'

export async function encryptFile(file, providedKey) {
  const key = providedKey ?? (await generateSymmetricKey())
  const iv = window.crypto.getRandomValues(new Uint8Array(12))
  const arrayBuffer = await file.arrayBuffer()

  const encrypted = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    key,
    arrayBuffer,
  )

  return {
    encrypted,
    iv,
    key,
  }
}