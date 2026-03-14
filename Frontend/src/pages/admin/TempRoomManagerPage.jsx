import { useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import RoomTimer from '../../components/temprooms/RoomTimer'
import {
  extendTempRoom,
  selectTempRooms,
  terminateTempRoom,
} from '../../features/temprooms/tempRoomSlice'

function TempRoomManagerPage() {
  const dispatch = useDispatch()
  const tempRooms = useSelector(selectTempRooms)
  const [viewMode, setViewMode] = useState('grid')

  const activeCount = useMemo(() => tempRooms.filter((room) => !room.locked).length, [tempRooms])

  return (
    <main className="app-page min-h-screen p-5">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-slate-900">Temporary Room Manager</h1>
        <Link to="/admin/dashboard" className="text-sm font-medium text-slate-700 underline">
          Back to Dashboard
        </Link>
      </div>

      <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Active Rooms</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{activeCount}</p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 md:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold text-slate-900">Policy Snapshot</p>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'grid' ? 'primary' : 'secondary'}
                className="text-xs"
                onClick={() => setViewMode('grid')}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'primary' : 'secondary'}
                className="text-xs"
                onClick={() => setViewMode('list')}
              >
                List
              </Button>
            </div>
          </div>
          <p className="text-sm text-slate-500">
            Recommended policy: time-box incident rooms to 60 minutes, extend only on explicit owner approval,
            and terminate idle rooms to reduce sidebar noise.
          </p>
        </div>
      </section>

      <section className={viewMode === 'grid' ? 'grid grid-cols-1 gap-3 md:grid-cols-2' : 'space-y-3'}>
        {tempRooms.length ? (
          tempRooms.map((room) => (
            <article key={room.id} className="rounded-lg border border-slate-200 bg-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-semibold text-slate-900">{room.name}</h2>
                  <p className="text-xs text-slate-500">Created by {room.createdBy}</p>
                </div>
                <div className="text-right">
                  <RoomTimer expiresAt={room.expiresAt} />
                  <p className="mt-1 text-[11px] text-slate-400">{room.locked ? 'Locked' : 'Active'}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  onClick={() => dispatch(extendTempRoom({ roomId: room.roomId, duration: '1h' }))}
                >
                  Extend +1h
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => dispatch(extendTempRoom({ roomId: room.roomId, duration: '15m' }))}
                >
                  Extend +15m
                </Button>
                <Button variant="danger" onClick={() => dispatch(terminateTempRoom(room.roomId))}>
                  Terminate
                </Button>
              </div>
            </article>
          ))
        ) : (
          <EmptyState
            title="No temporary rooms"
            description="Create them from chat with /create-temp-room to manage their lifecycle here."
          />
        )}
      </section>
    </main>
  )
}

export default TempRoomManagerPage