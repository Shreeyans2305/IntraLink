import { useDispatch, useSelector } from 'react-redux'
import { closePoll, createPoll, selectPolls, votePoll } from './pollSlice'

export function usePoll() {
  const dispatch = useDispatch()
  const polls = useSelector(selectPolls)

  return {
    polls,
    create: (payload) => dispatch(createPoll(payload)),
    vote: (payload) => dispatch(votePoll(payload)),
    close: (pollId) => dispatch(closePoll(pollId)),
  }
}