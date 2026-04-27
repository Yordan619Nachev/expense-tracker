import { useEffect, useState } from 'react'
import {
  Bar, BarChart, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts'
import api from '../api/client'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const COLORS = ['#6366f1', '#f59e0b', '#10b981', '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6']

export default function Dashboard() {
  const now = new Date()
  const [summary, setSummary] = useState([])
  const [trend, setTrend] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/expenses/summary', { params: { month: now.getMonth() + 1, year: now.getFullYear() } }),
      api.get('/expenses/monthly-trend'),
    ]).then(([summaryRes, trendRes]) => {
      setSummary(summaryRes.data)
      setTrend(trendRes.data.slice(-6))
    }).finally(() => setLoading(false))
  }, [])

  const totalMonth = summary.reduce((s, i) => s + i.total, 0)
  const topCategory = summary.length ? summary.reduce((a, b) => (a.total > b.total ? a : b)) : null
  const avgDaily = totalMonth / now.getDate()

  const trendFormatted = trend.map((t) => ({
    name: MONTHS[t.month - 1],
    total: t.total,
  }))

  if (loading) return <div className="spinner">Loading…</div>

  return (
    <>
      <div className="page">
        <div className="page-header">
          <h1>Dashboard</h1>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>
            {MONTHS[now.getMonth()]} {now.getFullYear()}
          </span>
        </div>

        <div className="grid-3">
          <div className="card">
            <div className="card-title">Total this month</div>
            <div className="card-value">${totalMonth.toFixed(2)}</div>
          </div>
          <div className="card">
            <div className="card-title">Daily average</div>
            <div className="card-value">${avgDaily.toFixed(2)}</div>
          </div>
          <div className="card">
            <div className="card-title">Top category</div>
            <div className="card-value" style={{ fontSize: 20 }}>
              {topCategory ? `${topCategory.category} ($${topCategory.total})` : '—'}
            </div>
          </div>
        </div>

        <div className="grid-2">
          <div className="card">
            <div className="section-title">Spending by Category</div>
            {summary.length === 0 ? (
              <div className="empty"><p>No data for this month yet.</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={summary} dataKey="total" nameKey="category" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {summary.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="card">
            <div className="section-title">Monthly Trend (last 6 months)</div>
            {trendFormatted.length === 0 ? (
              <div className="empty"><p>No trend data yet.</p></div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={trendFormatted} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v) => `$${v.toFixed(2)}`} />
                  <Bar dataKey="total" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
