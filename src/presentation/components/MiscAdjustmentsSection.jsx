import { useState } from 'react'

export function MiscAdjustmentsSection({ items, miscTotal, onSave, adminUid }) {
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editItems, setEditItems] = useState([])
  const [newLabel, setNewLabel] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [saving, setSaving] = useState(false)

  const handleOpen = () => {
    setEditing(false)
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
    setEditing(false)
  }

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
    <>
      <button className="misc-trigger-btn" onClick={handleOpen}>
        Misc
        {miscTotal !== 0 && (
          <span className={`misc-trigger-badge ${miscTotal >= 0 ? 'positive' : 'negative'}`}>
            {formatAmount(miscTotal)}
          </span>
        )}
      </button>

      {open && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal misc-modal" onClick={e => e.stopPropagation()}>
            <div className="misc-modal-header">
              <h3>Misc Adjustments</h3>
              <button className="modal-close-btn" onClick={handleClose}>&times;</button>
            </div>

            {!editing ? (
              <div className="misc-modal-body">
                {items.length === 0 ? (
                  <div className="misc-empty">No adjustments for this month</div>
                ) : (
                  <div className="misc-items-list">
                    {items.map(item => (
                      <div className="misc-item-row" key={item.id}>
                        <span className="misc-item-label">{item.label}</span>
                        <span className={`misc-item-amount ${item.amount >= 0 ? 'positive' : 'negative'}`}>
                          {formatAmount(item.amount)}
                        </span>
                      </div>
                    ))}
                    {miscTotal !== 0 && (
                      <div className="misc-item-row misc-total-row">
                        <span className="misc-item-label">Total</span>
                        <span className={`misc-item-amount ${miscTotal >= 0 ? 'positive' : 'negative'}`}>
                          {formatAmount(miscTotal)}
                        </span>
                      </div>
                    )}
                  </div>
                )}
                <button className="misc-edit-btn" onClick={handleStartEdit}>
                  {items.length > 0 ? 'Edit' : 'Add Items'}
                </button>
              </div>
            ) : (
              <div className="misc-modal-body">
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
        </div>
      )}
    </>
  )
}
