import { useState } from 'react'

export function MiscAdjustmentsSection({ items, miscTotal, onSave, adminUid }) {
  const [expanded, setExpanded] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editItems, setEditItems] = useState([])
  const [newLabel, setNewLabel] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const handleStartEdit = () => {
    setEditItems([...items])
    setNewLabel('')
    setNewAmount('')
    setEditing(true)
  }

  const handleCancel = () => {
    setEditing(false)
  }

  const handleAdd = () => {
    const amount = parseFloat(newAmount)
    if (!newLabel.trim() || isNaN(amount)) return
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2)
    setEditItems([...editItems, { id, label: newLabel.trim(), amount, createdAt: new Date().toISOString() }])
    setNewLabel('')
    setNewAmount('')
  }

  const handleRemove = (id) => {
    setEditItems(editItems.filter(item => item.id !== id))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSave(editItems, adminUid)
      setEditing(false)
    } catch (err) {
      console.error('Failed to save adjustments:', err)
    } finally {
      setSaving(false)
    }
  }

  const formatAmount = (amount) => {
    const prefix = amount >= 0 ? '+' : ''
    return `${prefix}$${Math.abs(amount).toLocaleString()}`
  }

  return (
    <div className="misc-adjustments-section">
      <div className="misc-header" onClick={() => setExpanded(!expanded)}>
        <span className="misc-title">
          <span className="misc-toggle-arrow">{expanded ? '\u25BC' : '\u25B6'}</span>
          Misc Adjustments
          {items.length > 0 && <span className="misc-count">({items.length})</span>}
        </span>
        {miscTotal !== 0 && (
          <span className={`misc-total-badge ${miscTotal >= 0 ? 'positive' : 'negative'}`}>
            {formatAmount(miscTotal)}
          </span>
        )}
      </div>

      {expanded && !editing && (
        <div className="misc-body">
          {items.length === 0 && (
            <div className="misc-empty">No adjustments for this month</div>
          )}
          {items.map(item => (
            <div className="misc-item-row" key={item.id}>
              <span className="misc-item-label">{item.label}</span>
              <span className={`misc-item-amount ${item.amount >= 0 ? 'positive' : 'negative'}`}>
                {formatAmount(item.amount)}
              </span>
            </div>
          ))}
          <button className="misc-edit-btn" onClick={handleStartEdit}>
            {items.length > 0 ? 'Edit' : 'Add Items'}
          </button>
        </div>
      )}

      {expanded && editing && (
        <div className="misc-body">
          {editItems.map(item => (
            <div className="misc-item-row misc-item-editing" key={item.id}>
              <span className="misc-item-label">{item.label}</span>
              <span className={`misc-item-amount ${item.amount >= 0 ? 'positive' : 'negative'}`}>
                {formatAmount(item.amount)}
              </span>
              <button className="misc-remove-btn" onClick={() => handleRemove(item.id)} title="Remove">&times;</button>
            </div>
          ))}
          <div className="misc-add-row">
            <input
              type="text"
              className="misc-label-input"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Label"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <input
              type="number"
              className="misc-amount-input"
              value={newAmount}
              onChange={(e) => setNewAmount(e.target.value)}
              placeholder="Amount"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button className="misc-add-btn" onClick={handleAdd} disabled={!newLabel.trim() || !newAmount}>+</button>
          </div>
          <div className="misc-edit-actions">
            <button className="misc-cancel-btn" onClick={handleCancel} disabled={saving}>Cancel</button>
            <button className="misc-save-btn" onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
