import { useRoomCountdown } from '../../hooks/useRoomCountdown'

function RoomTimer({ expiresAt }) {
  const { formatted, expired } = useRoomCountdown(expiresAt)

  return (
    <span className={`text-xs font-medium ${expired ? 'text-red-600' : 'text-amber-700'}`}>
      {expired ? 'Expired' : formatted}
    </span>
  )
}

export default RoomTimer