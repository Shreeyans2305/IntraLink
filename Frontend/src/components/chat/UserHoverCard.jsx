import PresenceDot from '../presence/PresenceDot'

function UserHoverCard({ profile }) {
  if (!profile) {
    return null
  }

  return (
    <div className="absolute left-0 top-6 z-30 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <div className="mb-2 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">{profile.name}</p>
          <p className="text-xs text-slate-500">{profile.role} · {profile.team}</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-slate-600">
          <PresenceDot status={profile.status} />
          <span>{profile.status}</span>
        </div>
      </div>
      <p className="text-xs text-slate-500">{profile.bio}</p>
      <div className="mt-3 rounded-lg bg-slate-50 px-2 py-2 text-xs text-slate-600">
        <p className="font-medium text-slate-700">Recent</p>
        <p className="mt-1">{profile.recentActivity}</p>
      </div>
    </div>
  )
}

export default UserHoverCard