import { createPortal } from 'react-dom'
import { useRef, useState } from 'react'

const CATEGORIES = ['Food', 'Transport', 'Housing', 'Health', 'Entertainment', 'Shopping', 'Utilities', 'Other']

export default function ExpenseForm({ initial, onSubmit, onClose }) {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const amountRef = useRef()
  const categoryRef = useRef()
  const descriptionRef = useRef()
  const dateRef = useRef()

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = parseFloat(amountRef.current.value)
    if (!amountRef.current.value || isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount greater than 0')
      return
    }
    setLoading(true)
    setError('')
    try {
      await onSubmit({
        amount,
        category: categoryRef.current.value,
        description: descriptionRef.current.value,
        date: dateRef.current.value,
      })
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">{initial ? 'Edit Expense' : 'Add Expense'}</span>
          <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Amount (€)</label>
            <input
              ref={amountRef}
              className="form-input"
              type="text"
              inputMode="decimal"
              defaultValue={initial?.amount ?? ''}
              placeholder="0.00"
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Category</label>
            <select ref={categoryRef} className="form-input" defaultValue={initial?.category ?? CATEGORIES[0]}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              ref={descriptionRef}
              className="form-input"
              type="text"
              defaultValue={initial?.description ?? ''}
              placeholder="Optional note"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Date</label>
            <input
              ref={dateRef}
              className="form-input"
              type="date"
              defaultValue={initial?.date ?? new Date().toISOString().slice(0, 10)}
            />
          </div>
          {error && <p className="form-error">{error}</p>}
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}
