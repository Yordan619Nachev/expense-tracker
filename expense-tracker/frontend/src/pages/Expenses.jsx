import { useEffect, useState } from 'react'
import api from '../api/client'
import ExpenseForm from '../components/ExpenseForm'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export default function Expenses() {
  const now = new Date()
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [filters, setFilters] = useState({ month: now.getMonth() + 1, year: now.getFullYear(), category: '' })

  const fetchExpenses = async () => {
    setLoading(true)
    const params = {}
    if (filters.month) params.month = filters.month
    if (filters.year) params.year = filters.year
    if (filters.category) params.category = filters.category
    const { data } = await api.get('/expenses/', { params })
    setExpenses(data)
    setLoading(false)
  }

  useEffect(() => { fetchExpenses() }, [filters])

  const handleCreate = async (form) => {
    await api.post('/expenses/', form)
    setShowForm(false)
    fetchExpenses()
  }

  const handleUpdate = async (form) => {
    await api.put(`/expenses/${editing.id}`, form)
    setEditing(null)
    fetchExpenses()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this expense?')) return
    await api.delete(`/expenses/${id}`)
    fetchExpenses()
  }

  const handleExport = () => {
    const token = localStorage.getItem('token')
    const params = new URLSearchParams()
    if (filters.month) params.set('month', filters.month)
    if (filters.year) params.set('year', filters.year)
    window.location.href = `http://localhost:8000/expenses/export?${params}`
  }

  const setFilter = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }))
  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return (
    <div className="page">
      <div className="page-header">
        <h1>Expenses</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={handleExport}>Export CSV</button>
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>+ Add Expense</button>
        </div>
      </div>

      <div className="filter-bar">
        <select className="form-input" value={filters.month} onChange={setFilter('month')}>
          <option value="">All months</option>
          {MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
        </select>
        <input className="form-input" type="number" value={filters.year} onChange={setFilter('year')} placeholder="Year" style={{ width: 90 }} />
        <input className="form-input" type="text" value={filters.category} onChange={setFilter('category')} placeholder="Filter category…" style={{ width: 160 }} />
        <button className="btn btn-ghost btn-sm" onClick={() => setFilters({ month: '', year: '', category: '' })}>Clear</button>
      </div>

      <div className="card">
        {loading ? (
          <div className="spinner">Loading…</div>
        ) : expenses.length === 0 ? (
          <div className="empty">
            <strong>No expenses found</strong>
            <p>Add your first expense to get started.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td style={{ color: 'var(--muted)', fontSize: 13 }}>{e.date}</td>
                    <td><span className="badge">{e.category}</span></td>
                    <td style={{ color: 'var(--muted)' }}>{e.description || '—'}</td>
                    <td style={{ fontWeight: 600 }}>${e.amount.toFixed(2)}</td>
                    <td>
                      <div className="actions">
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditing(e)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(e.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={3} style={{ fontWeight: 600, padding: '12px' }}>Total</td>
                  <td style={{ fontWeight: 700, fontSize: 15, padding: '12px' }}>${total.toFixed(2)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {showForm && <ExpenseForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />}
      {editing && <ExpenseForm initial={editing} onSubmit={handleUpdate} onClose={() => setEditing(null)} />}
    </div>
  )
}
