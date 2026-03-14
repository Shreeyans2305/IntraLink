import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { useFiles } from '../../features/files/useFiles'
import { selectCurrentUser } from '../../features/auth/authSlice'

function BookmarksPage() {
  const user = useSelector(selectCurrentUser)
  const { bookmarks, deleteBookmark, updateBookmark } = useFiles()
  const [search, setSearch] = useState('')
  const [roomFilter, setRoomFilter] = useState('all')

  const visibleBookmarks = useMemo(
    () =>
      bookmarks.filter((bookmark) => {
        const searchMatches = search
          ? `${bookmark.text} ${(bookmark.tags ?? []).join(' ')} ${bookmark.note ?? ''}`
              .toLowerCase()
              .includes(search.toLowerCase())
          : true
        const roomMatches = roomFilter === 'all' ? true : bookmark.roomId === roomFilter
        return searchMatches && roomMatches
      }),
    [bookmarks, roomFilter, search],
  )

  const roomOptions = Array.from(new Set(bookmarks.map((bookmark) => bookmark.roomId)))

  return (
    <main className="app-page min-h-screen p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Bookmarks</h1>
          <p className="text-sm text-slate-500">Saved by {user?.name ?? 'current user'}</p>
        </div>
        <Link to="/chat" className="text-sm font-medium text-slate-700 underline">
          Back to Chat
        </Link>
      </div>

      <section className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-3">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search bookmark text, tags, notes"
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <select
          value={roomFilter}
          onChange={(event) => setRoomFilter(event.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="all">All rooms</option>
          {roomOptions.map((roomId) => (
            <option key={roomId} value={roomId}>
              {roomId}
            </option>
          ))}
        </select>
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500">
          {visibleBookmarks.length} bookmark(s)
        </div>
      </section>

      <section className="space-y-3">
        {visibleBookmarks.length ? (
          visibleBookmarks.map((bookmark) => (
            <article key={bookmark.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <p className="mb-2 text-sm text-slate-800">{bookmark.text}</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {(bookmark.tags ?? []).map((tag) => (
                  <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-600">
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mb-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                <input
                  value={(bookmark.tags ?? []).join(', ')}
                  onChange={(event) =>
                    updateBookmark({
                      id: bookmark.id,
                      tags: event.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                      note: bookmark.note,
                    })
                  }
                  placeholder="Tags, comma separated"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
                <input
                  value={bookmark.note ?? ''}
                  onChange={(event) =>
                    updateBookmark({
                      id: bookmark.id,
                      tags: bookmark.tags,
                      note: event.target.value,
                    })
                  }
                  placeholder="Personal note"
                  className="rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">
                  {bookmark.roomId} • {new Date(bookmark.savedAt).toLocaleString()}
                </p>
                <Button variant="danger" onClick={() => deleteBookmark(bookmark.id)}>
                  Remove
                </Button>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            title="No bookmarks yet"
            description="Save messages from chat to build a personal board with tags and notes."
          />
        )}
      </section>
    </main>
  )
}

export default BookmarksPage