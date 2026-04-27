import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'

const REQUIREMENTS = [
  { label: 'At least 8 characters', test: (p) => p.length >= 8 },
  { label: 'One uppercase letter',  test: (p) => /[A-Z]/.test(p) },
  { label: 'One lowercase letter',  test: (p) => /[a-z]/.test(p) },
  { label: 'One number',            test: (p) => /[0-9]/.test(p) },
]

function parseError(err) {
  const detail = err.response?.data?.detail
  if (!detail) return 'Login failed. Please try again.'
  if (Array.isArray(detail)) return detail[0]?.msg ?? 'Validation error'
  return detail
}

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [unverified, setUnverified] = useState(false)
  const [resendSent, setResendSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [pwFocused, setPwFocused] = useState(false)
  const [twoFAStep, setTwoFAStep] = useState(false)
  const [preAuthToken, setPreAuthToken] = useState('')
  const [otpCode, setOtpCode] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const allMet = REQUIREMENTS.every((r) => r.test(form.password))
  const showRequirements = pwFocused || form.password.length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!allMet) return
    setLoading(true)
    setError('')
    setUnverified(false)
    try {
      const { data } = await api.post('/auth/login', form)
      if (data.requires_2fa) {
        setPreAuthToken(data.pre_auth_token)
        setTwoFAStep(true)
      } else {
        const { data: userData } = await api.get('/auth/me')
        login(userData)
        navigate('/dashboard')
      }
    } catch (err) {
      if (err.response?.status === 403) {
        setUnverified(true)
      } else {
        setError(parseError(err))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    await api.post('/auth/resend-verification', { email: form.email })
    setResendSent(true)
  }

  const handleVerify2FA = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/2fa/verify', { pre_auth_token: preAuthToken, code: otpCode })
      const { data: userData } = await api.get('/auth/me')
      login(userData)
      navigate('/dashboard')
    } catch (err) {
      setError(parseError(err))
    } finally {
      setLoading(false)
    }
  }

  if (twoFAStep) {
    return (
      <div className="auth-wrapper">
        <div className="card auth-card">
          <h1>Two-factor auth</h1>
          <p>Enter the 6-digit code from your authenticator app</p>
          <form onSubmit={handleVerify2FA}>
            <div className="form-group">
              <label className="form-label">Authentication code</label>
              <input
                className="form-input"
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                autoFocus
                required
              />
            </div>
            {error && <p className="form-error">{error}</p>}
            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%' }}
              disabled={loading || otpCode.length !== 6}
            >
              {loading ? 'Verifying…' : 'Verify'}
            </button>
          </form>
          <p className="auth-link">
            <button
              className="btn btn-ghost btn-sm"
              style={{ marginTop: 8 }}
              onClick={() => { setTwoFAStep(false); setOtpCode(''); setError('') }}
            >
              ← Back
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <h1>Welcome back</h1>
        <p>Sign in to your account</p>
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

          {unverified && (
            <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--bg)', borderRadius: 7, border: '1px solid var(--border)' }}>
              <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 8 }}>
                Your email address has not been verified yet.
              </p>
              {resendSent
                ? <p style={{ color: 'var(--success)', fontSize: 13 }}>Verification email resent!</p>
                : <button type="button" className="btn btn-ghost btn-sm" onClick={handleResend}>Resend verification email</button>
              }
            </div>
          )}

          {error && <p className="form-error">{error}</p>}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%' }}
            disabled={loading || !allMet}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="auth-link">No account? <Link to="/register">Create one</Link></p>
      </div>
    </div>
  )
}
