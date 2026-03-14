import RoomTimer from './RoomTimer'

function TempRoomBadge({ room }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-amber-300 bg-amber-50 px-2 py-1">
      <span className="truncate text-xs font-semibold text-amber-900">⏱ {room.name}</span>
      <RoomTimer expiresAt={room.expiresAt} />
    </div>
  )
}

export default TempRoomBadge