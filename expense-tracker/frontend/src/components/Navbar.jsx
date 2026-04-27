import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="navbar">
      <NavLink to="/dashboard" className="navbar-brand">ExpenseTracker</NavLink>
      <div className="navbar-links">
        <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Dashboard
        </NavLink>
        <NavLink to="/expenses" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>
          Expenses
        </NavLink>
        <button className="btn btn-ghost btn-sm" onClick={() => setDark((d) => !d)}>
          {dark ? '☀ Light' : '☾ Dark'}
        </button>
        <button className="btn btn-ghost btn-sm" onClick={handleLogout}>Logout</button>
      </div>
    </nav>
  )
}
