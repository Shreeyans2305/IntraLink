import { summarizeThread } from '../../services/aiService'

export async function summarizeApi(payload) {
  return summarizeThread(payload)
}