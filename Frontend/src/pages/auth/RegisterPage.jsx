import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'

function RegisterPage() {
  const { register: formRegister, handleSubmit } = useForm({
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  })
  const { register } = useAuth()
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const onSubmit = async (values) => {
    setLoading(true)
    setErrorMsg('')
    try {
      await register(values)
    } catch (err) {
      setErrorMsg(err.response?.data?.detail || "Failed to register. Please check your details.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950">
      {/* Dynamic Background Elements */}
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-purple-600 opacity-20 blur-[100px] mix-blend-screen animate-pulse"></div>
      <div className="absolute -bottom-40 -right-40 h-[600px] w-[600px] rounded-full bg-emerald-500 opacity-20 blur-[120px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500 opacity-10 blur-[100px] mix-blend-screen"></div>

      <form
        className="relative z-10 w-full max-w-md space-y-5 rounded-2xl border border-white/5 bg-white/5 p-8 text-white shadow-2xl backdrop-blur-xl sm:p-10"
        onSubmit={handleSubmit(onSubmit)}
      >
        <header className="mb-2 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/30">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Join IntraLink</h1>
          <p className="mt-2 text-sm text-slate-400">
            You must be whitelisted by an administrator to register.
          </p>
        </header>

        {errorMsg && (
          <div className="rounded-xl border border-red-500/50 bg-red-500/10 p-3 text-center text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Name</label>
            <input
              {...formRegister('name', { required: true })}
              type="text"
              placeholder="Full Name"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Email</label>
            <input
              {...formRegister('email', { required: true })}
              type="email"
              placeholder="name@company.com"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">Password</label>
            <input
              {...formRegister('password', { required: true })}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder-slate-500 transition-all focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading} 
          className="group relative flex w-full justify-center overflow-hidden rounded-xl bg-purple-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-purple-500 hover:shadow-purple-500/30 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-70"
        >
          {loading ? 'Creating...' : 'Create Account'}
          <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full"></div>
        </button>

        <p className="text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-purple-400 transition-colors hover:text-purple-300">
            Sign In
          </Link>
        </p>
      </form>
    </main>
  )
}

export default RegisterPage