import { encryptFile } from '../../utils/encryption/encryptFile'

export async function encryptedUpload(file, key) {
  const encrypted = await encryptFile(file, key)
  return {
    id: `upload-${Date.now()}`,
    filename: file.name,
    size: file.size,
    encrypted,
    decrypted: false,
  }
}