import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { selectIsAuthenticated } from '../features/auth/authSlice'

function OptionCard({ title, description, to, cta, accent = 'brand' }) {
  const accentClass = accent === 'emerald'
    ? 'from-emerald-500/20 to-cyan-500/10 border-emerald-500/30 hover:border-emerald-400/50'
    : accent === 'violet'
      ? 'from-violet-500/20 to-fuchsia-500/10 border-violet-500/30 hover:border-violet-400/50'
      : 'from-brand-500/20 to-sky-500/10 border-brand-500/30 hover:border-brand-400/50'

  return (
    <Link
      to={to}
      className={`group rounded-2xl border bg-gradient-to-br p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(59,130,246,0.18)] ${accentClass}`}
    >
      <h2 className="text-xl font-semibold text-zinc-100">{title}</h2>
      <p className="mt-2 text-sm text-zinc-300/90">{description}</p>
      <span className="mt-5 inline-flex rounded-xl border border-white/20 bg-white/5 px-3 py-1.5 text-sm font-medium text-zinc-100 group-hover:bg-white/10">
        {cta}
      </span>
    </Link>
  )
}

function LandingPage() {                                          // ← added
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    import('../services/apiClient').then(({ default: apiClient }) => {
      apiClient.get('/org').then(res => {
        setOrgs(res.data.orgs || [])
        setLoading(false)
      }).catch(() => setLoading(false))
    })
  }, [])

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950 px-4 py-10">
      <div className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-brand-500/20 blur-[110px]" />
      <div className="absolute -right-36 -bottom-44 h-[560px] w-[560px] rounded-full bg-violet-500/20 blur-[120px]" />

      <div className="relative z-10 w-full max-w-5xl rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-6 backdrop-blur-xl sm:p-10">
        <header className="mx-auto max-w-2xl text-center">
          <img src="/LOGO.webp" alt="IntraLink" className="mx-auto h-20 w-20 rounded-2xl object-cover" />
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-zinc-100">Welcome to IntraLink</h1>
          <p className="mt-3 text-zinc-300">
            Choose how you want to get started.<br />
            <span className="text-brand-400">Multiple organizations are supported. You can create a new one even if others exist.</span>
          </p>
          {isAuthenticated ? (
            <Link
              to="/chat"
              className="mt-5 inline-flex rounded-xl border border-brand-500/40 bg-brand-500/15 px-4 py-2 text-sm font-semibold text-brand-300 hover:bg-brand-500/25"
            >
              Continue to Chat
            </Link>
          ) : null}
        </header>

        <section className="mt-10 grid gap-4 md:grid-cols-3">
          <OptionCard
            title="Create Organization"
            description="Initialize a new IntraLink workspace and set up your first admin account. Multiple organizations are supported."
            to="/setup"
            cta="Start Setup"
            accent="emerald"
          />
          <OptionCard
            title="Log In"
            description={orgs.length === 0 ? "No organizations exist yet. Create one first." : "Access your existing organization with your approved account credentials."}
            to="/login"
            cta="Sign In"
            accent="brand"
          />
          <OptionCard
            title="Register"
            description={orgs.length === 0 ? "No organizations exist yet. Create one first." : "Create a new user account if your email is already whitelisted by your admin."}
            to="/register"
            cta="Create Account"
            accent="violet"
          />
        </section>

        {loading ? (
          <div className="mt-8 text-center text-zinc-400">Loading organizations...</div>
        ) : orgs.length > 0 ? (
          <div className="mt-8 text-center">
            <span className="text-zinc-300 text-sm">Available organizations:</span>
            <ul className="mt-2 flex flex-wrap justify-center gap-2">
              {orgs.map(org => (
                <li key={org.id} className="rounded-lg border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-brand-300 text-xs font-semibold">
                  {org.name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
    </main>
  )
}

export default LandingPage