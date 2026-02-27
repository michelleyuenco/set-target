import { useState, useRef } from 'react'

export function LocationManagerModal({ locations, onAdd, onUpdate, onRemove, onReorder, onToggleVisible, onClose }) {
  const [newName, setNewName] = useState('')
  const [newAbbr, setNewAbbr] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [editingAbbr, setEditingAbbr] = useState('')

  // Drag-and-drop state (indices into the locations array)
  const dragIndexRef = useRef(null)
  const [dragOverIndex, setDragOverIndex] = useState(null)

  const handleAdd = async () => {
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    try {
      await onAdd(name, newAbbr.trim())
      setNewName('')
      setNewAbbr('')
    } catch (err) {
      console.error('Failed to add location:', err)
    } finally {
      setAdding(false)
    }
  }

  const startEdit = (loc) => {
    setEditingId(loc.id)
    setEditingName(loc.name)
    setEditingAbbr(loc.abbr || '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditingName('')
    setEditingAbbr('')
  }

  const handleSaveEdit = async () => {
    const name = editingName.trim()
    if (!name || !editingId) return
    try {
      await onUpdate(editingId, name, editingAbbr.trim())
      setEditingId(null)
      setEditingName('')
      setEditingAbbr('')
    } catch (err) {
      console.error('Failed to update location:', err)
    }
  }

  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveEdit()
    if (e.key === 'Escape') cancelEdit()
  }

  // ── Drag-and-drop handlers ──
  const handleDragStart = (e, index) => {
    dragIndexRef.current = index
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }

  const handleDrop = (e, dropIndex) => {
    e.preventDefault()
    const fromIndex = dragIndexRef.current
    if (fromIndex === null || fromIndex === dropIndex) {
      setDragOverIndex(null)
      return
    }
    const reordered = [...locations]
    const [moved] = reordered.splice(fromIndex, 1)
    reordered.splice(dropIndex, 0, moved)
    onReorder(reordered)
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  const handleDragEnd = () => {
    dragIndexRef.current = null
    setDragOverIndex(null)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal location-manager-modal" onClick={e => e.stopPropagation()}>
        <h2>Manage Locations</h2>

        <div className="location-add-row">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Location name"
            disabled={adding}
            className="location-input"
          />
          <input
            type="text"
            value={newAbbr}
            onChange={(e) => setNewAbbr(e.target.value.slice(0, 6))}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Abbr."
            disabled={adding}
            className="location-abbr-input"
            title="Short abbreviation shown on mobile (up to 6 characters)"
          />
          <button
            className="save-btn location-add-btn"
            onClick={handleAdd}
            disabled={!newName.trim() || adding}
          >
            Add
          </button>
        </div>
        <p className="location-abbr-hint">Abbr. is shown in the roster calendar on small screens</p>

        <p className="location-reorder-hint">Drag ⠿ to reorder · click the eye to show/hide</p>

        <div className="location-list">
          {locations.length === 0 && (
            <div className="location-empty">No locations yet</div>
          )}
          {locations.map((loc, index) => (
            <div
              key={loc.id}
              className={`location-item${!loc.visible ? ' location-item-hidden' : ''}${dragOverIndex === index ? ' location-item-drag-over' : ''}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
            >
              {/* Drag handle */}
              <span className="location-drag-handle" title="Drag to reorder">⠿</span>

              {editingId === loc.id ? (
                <div className="location-edit-row">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={handleEditKeyDown}
                    className="location-edit-input"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editingAbbr}
                    onChange={(e) => setEditingAbbr(e.target.value.slice(0, 6))}
                    onKeyDown={handleEditKeyDown}
                    placeholder="Abbr."
                    className="location-abbr-edit-input"
                    title="Short abbreviation (up to 6 characters)"
                  />
                  <button className="location-save-edit-btn" onClick={handleSaveEdit} disabled={!editingName.trim()} title="Save">
                    &#10003;
                  </button>
                  <button className="location-cancel-edit-btn" onClick={cancelEdit} title="Cancel">
                    &times;
                  </button>
                </div>
              ) : (
                <>
                  <div className="location-name-group" onClick={() => startEdit(loc)} title="Click to edit">
                    <span className={`location-name${!loc.visible ? ' location-name-hidden' : ''}`}>
                      {loc.name}
                    </span>
                    {loc.abbr && (
                      <span className="location-abbr-badge">{loc.abbr}</span>
                    )}
                  </div>
                  <div className="location-actions">
                    <button
                      className={`location-visibility-btn${loc.visible ? ' visible' : ' hidden'}`}
                      onClick={() => onToggleVisible(loc.id, !loc.visible)}
                      title={loc.visible ? 'Hide location' : 'Show location'}
                    >
                      {loc.visible ? '👁' : '🙈'}
                    </button>
                    <button className="location-edit-btn" onClick={() => startEdit(loc)} title="Edit">
                      &#9998;
                    </button>
                    <button className="location-remove-btn" onClick={() => onRemove(loc.id)} title="Remove">
                      &times;
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        <div className="button-group">
          <button className="cancel-btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
