import { fetchSmartReplies } from '../../services/aiService'

export async function smartReplyApi(payload) {
  return fetchSmartReplies(payload)
}