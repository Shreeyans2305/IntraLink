import { useDispatch, useSelector } from 'react-redux'
import { selectReactionsByMessage, toggleReaction } from './reactionSlice'

export function useReactions() {
  const dispatch = useDispatch()
  const reactionsByMessage = useSelector(selectReactionsByMessage)

  return {
    reactionsByMessage,
    reactToMessage: (payload) => dispatch(toggleReaction(payload)),
  }
}