import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { useAuth } from '../../features/auth/useAuth'
import Button from '../../components/ui/Button'

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

  const onSubmit = async (values) => {
    setLoading(true)
    try {
      await register(values)
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
          <h1 className="text-2xl font-semibold text-slate-900">Create IntraLink Account</h1>
        </header>

        <input
          {...formRegister('name', { required: true })}
          placeholder="Full name"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          {...formRegister('email', { required: true })}
          type="email"
          placeholder="Email"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <input
          {...formRegister('password', { required: true })}
          type="password"
          placeholder="Password"
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Creating account...' : 'Create account'}
        </Button>

        <p className="text-sm text-slate-600">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-slate-900 underline">
            Login
          </Link>
        </p>
      </form>
    </main>
  )
}

export default RegisterPage