import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api from '../api/client'

export default function VerifyEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const called = useRef(false)

  useEffect(() => {
    if (called.current) return
    called.current = true

    const token = searchParams.get('token')
    if (!token) { setStatus('invalid'); return }

    api.get(`/auth/verify-email?token=${encodeURIComponent(token)}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('invalid'))
  }, [])

  return (
    <div className="auth-wrapper">
      <div className="card auth-card" style={{ textAlign: 'center' }}>
        {status === 'loading' && <p>Verifying…</p>}
        {status === 'success' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✓</div>
            <h1>Email verified!</h1>
            <p style={{ marginBottom: 24 }}>Your account is now active.</p>
            <Link to="/login" className="btn btn-primary">Sign in</Link>
          </>
        )}
        {status === 'invalid' && (
          <>
            <div style={{ fontSize: 48, marginBottom: 16 }}>✗</div>
            <h1>Link invalid or expired</h1>
            <p style={{ marginBottom: 24 }}>This verification link is no longer valid.</p>
            <Link to="/login" className="btn btn-ghost">Back to login</Link>
          </>
        )}
      </div>
    </div>
  )
}
