import { useDispatch, useSelector } from 'react-redux'
import { resolveModerationItem, selectAdminState } from './adminSlice'

export function useAdmin() {
  const dispatch = useDispatch()
  const adminState = useSelector(selectAdminState)

  return {
    ...adminState,
    resolveModeration: (id) => dispatch(resolveModerationItem(id)),
  }
}