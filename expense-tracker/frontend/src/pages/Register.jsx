import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

const REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',  test: (p) => /[a-z]/.test(p) },
  { label: 'One number',            test: (p) => /[0-9]/.test(p) },
]

function parseError(err) {
  const detail = err.response?.data?.detail
  if (!detail) return 'Registration failed. Please try again.'
  if (Array.isArray(detail)) return detail[0]?.msg ?? 'Validation error'
  return detail
}

export default function Register() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [pwFocused, setPwFocused] = useState(false)
  const [done, setDone] = useState(false)
  const [devUrl, setDevUrl] = useState('')

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const allMet = REQUIREMENTS.every((r) => r.test(form.password))
  const showRequirements = pwFocused || form.password.length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!allMet) return
    setLoading(true)
    setError('')
    try {
      const { data } = await api.post('/auth/register', form)
      if (data.dev_verification_url) setDevUrl(data.dev_verification_url)
      setDone(true)
    } catch (err) {
      setError(parseError(err))
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="auth-wrapper">
        <div className="card auth-card" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📧</div>
          <h1>Check your email</h1>
          <p style={{ marginBottom: 16 }}>
            We sent a verification link to <strong>{form.email}</strong>.
            Click it to activate your account.
          </p>
          {devUrl && (
            <div style={{ marginBottom: 16, padding: '10px 12px', background: 'var(--bg)', borderRadius: 7, border: '1px solid var(--border)', textAlign: 'left' }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 6 }}>Dev mode — no SMTP configured. Use this link:</p>
              <a href={devUrl} style={{ fontSize: 12, color: 'var(--primary)', wordBreak: 'break-all' }}>{devUrl}</a>
            </div>
          )}
          <button
            className="btn btn-ghost btn-sm"
            onClick={async () => {
              const { data } = await api.post('/auth/resend-verification', { email: form.email })
              if (data.dev_verification_url) setDevUrl(data.dev_verification_url)
              else alert('Verification email resent!')
            }}
          >
            Resend email
          </button>
          <p className="auth-link" style={{ marginTop: 16 }}>
            Already verified? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <h1>Create account</h1>
        <p>Start tracking your expenses today</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              value={form.email}
              onChange={set('email')}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              value={form.password}
              onChange={set('password')}
              onFocus={() => setPwFocused(true)}
              placeholder="••••••••"
              required
            />
            {showRequirements && (
              <ul className="pw-requirements">
                {REQUIREMENTS.map((r) => (
                  <li key={r.label} className={r.test(form.password) ? 'req-met' : 'req-unmet'}>
                    {r.test(form.password) ? '✓' : '✗'} {r.label}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {error && <p className="form-error">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading || !allMet}
          >
            {loading ? 'Creating…' : 'Create account'}
          </button>
        </form>
        <p className="auth-link">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </div>
  )
}
