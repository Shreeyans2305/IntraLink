import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import Button from '../../components/ui/Button'

function LoginPage() {
  const { register, handleSubmit } = useForm({
    defaultValues: {
      email: 'demo@intralink.io',
      password: 'demo123',
    },
  })
  const { login } = useAuth()
  const [loading, setLoading] = useState(false)

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      await login(values)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 p-4">
      <form
        className="w-full max-w-md space-y-4 rounded-xl border border-slate-200 bg-white p-6"
        onSubmit={handleSubmit(onSubmit)}
      >
        <header>
          <h1 className="text-2xl font-semibold text-slate-900">IntraLink Login</h1>
          <p className="mt-1 text-sm text-slate-500">
            Use an email containing admin to enter admin routes.
          </p>
        </header>

        <input
          {...register('email', { required: true })}
          type="email"
          placeholder="Email"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          {...register('password', { required: true })}
          type="password"
          placeholder="Password"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>

        <p className="text-sm text-slate-600">
          No account?{' '}
          <Link to="/register" className="font-semibold text-slate-900 underline">
            Register
          </Link>
        </p>
      </form>
    </main>
  )
}

export default LoginPage