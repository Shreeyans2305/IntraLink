import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import LoadingScreen from '../../components/ui/LoadingScreen'

function LoginPage() {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: 'demo@intralink.io',
      password: 'demo123',
    },
  })
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const onSubmit = async (values) => {
    setLoading(true)
    setErrorMsg('')
    try {
      await login(values)
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Invalid credentials provided.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <LoadingScreen isLoading={loading} loadingText="Authenticating" />

      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-zinc-950">
      {/* Dynamic Background Elements */}
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-brand-500 opacity-20 blur-[100px] mix-blend-screen animate-pulse"></div>
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-blue-600 opacity-20 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500 opacity-10 blur-[100px] mix-blend-screen"></div>

      <form
        className="relative z-10 w-full max-w-md space-y-6 rounded-2xl border border-zinc-800/80 bg-white/5 p-8 text-white shadow-[0_0_40px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-10"
        onSubmit={handleSubmit(onSubmit)}
      >
        <header className="mb-2 text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl shadow-[0_0_20px_rgba(59,130,246,0.35)]">
            <img src="/logo.webp" alt="IntraLink" className="h-20 w-20 rounded-2xl object-cover" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">IntraLink</h1>
          <p className="mt-2 text-sm text-zinc-400">
            Log in to your organization's workspace.
          </p>
        </header>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-center text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Email</label>
            <input
              {...register('email', { required: true })}
              type="email"
              placeholder="name@company.com"
              className="w-full rounded-xl border border-zinc-800 bg-black/20 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-300">Password</label>
            <input
              {...register('password', { required: true })}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-zinc-800 bg-black/20 px-4 py-3 text-sm text-white placeholder-zinc-500 transition-all focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/50"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="group relative flex w-full justify-center overflow-hidden rounded-xl bg-brand-600 px-4 py-3 text-sm font-medium text-white shadow-[0_0_20px_rgba(59,130,246,0.3)] transition-all hover:bg-brand-500 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-70"
        >
          {loading ? 'Authenticating...' : 'Sign In'}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full"></div>
        </button>

        <p className="text-center text-sm text-zinc-400">
          Need access?{' '}
          <Link to="/register" className="font-semibold text-brand-400 transition-colors hover:text-brand-300">
            Register for access
          </Link>
        </p>
      </form>
      </main>
    </>
  )
}

export default LoginPage