import PresenceDot from '../presence/PresenceDot'

function UserHoverCard({ profile }) {
  if (!profile) {
    return null
  }

  return (
    <div className="absolute left-0 top-6 z-30 w-64 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-100">{profile.name}</p>
          <p className="text-xs text-zinc-400">{profile.role} · {profile.team}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-zinc-400">
          <PresenceDot status={profile.status} />
          <span>{profile.status}</span>
        </div>
      </div>
      <p className="text-xs text-zinc-400">{profile.bio}</p>
      <div className="mt-3 rounded-lg bg-zinc-900/60 px-2 py-2 text-xs text-zinc-400">
        <p className="font-medium text-zinc-300">Recent</p>
        <p className="mt-1">{profile.recentActivity}</p>
      </div>
    </div>
  )
}

export default UserHoverCard