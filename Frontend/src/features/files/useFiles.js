import { useDispatch, useSelector } from 'react-redux'
import { addBookmark, removeBookmark, selectFileState, updateBookmarkMeta } from './fileSlice'

export function useFiles() {
  const dispatch = useDispatch()
  const fileState = useSelector(selectFileState)

  return {
    ...fileState,
    saveBookmark: (payload) => dispatch(addBookmark(payload)),
    deleteBookmark: (id) => dispatch(removeBookmark(id)),
    updateBookmark: (payload) => dispatch(updateBookmarkMeta(payload)),
  }
}