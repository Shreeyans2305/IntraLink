function RoomExpiredBanner() {
  return (
    <div className="rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400">
      This temporary room has expired and is now read-only.
    </div>
  )
}

export default RoomExpiredBanner