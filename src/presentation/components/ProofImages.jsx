import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export function ProofImages({
  images = [],
  pendingFiles = [],
  onUpload,
  onDelete,
  onReplace,
  onRemovePending,
  uploading,
  disabled,
  readOnly,
  onOpenPreview
}) {
  const controlled = typeof onOpenPreview === 'function'
  const [previewIndex, setPreviewIndex] = useState(null)

  // Pending files split into two kinds: replacements (sit in the original
  // image's slot via `replacingPath`) and pure additions (appended at end).
  const replacementsByPath = new Map()
  const additions = []
  pendingFiles.forEach((pf, i) => {
    const tagged = { ...pf, pendingIndex: i }
    if (pf.replacingPath) replacementsByPath.set(pf.replacingPath, tagged)
    else additions.push(tagged)
  })

  const positionedItems = images.map(img => {
    const r = replacementsByPath.get(img.path)
    if (r) {
      return {
        url: r.localUrl,
        name: r.name,
        isPending: true,
        pendingIndex: r.pendingIndex,
        original: img
      }
    }
    return { url: img.url, name: img.name, isPending: false, original: img }
  })

  const allItems = [
    ...positionedItems,
    ...additions.map(pf => ({
      url: pf.localUrl,
      name: pf.name,
      isPending: true,
      pendingIndex: pf.pendingIndex
    }))
  ]

  const previewItem = !controlled && previewIndex !== null ? allItems[previewIndex] : null

  const goToPrev = (e) => {
    e.stopPropagation()
    setPreviewIndex(prev => (prev > 0 ? prev - 1 : allItems.length - 1))
  }

  const goToNext = (e) => {
    e.stopPropagation()
    setPreviewIndex(prev => (prev < allItems.length - 1 ? prev + 1 : 0))
  }

  useEffect(() => {
    if (controlled || previewIndex === null || allItems.length <= 1) return
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setPreviewIndex(prev => (prev > 0 ? prev - 1 : allItems.length - 1))
      } else if (e.key === 'ArrowRight') {
        setPreviewIndex(prev => (prev < allItems.length - 1 ? prev + 1 : 0))
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [controlled, previewIndex, allItems.length])

  const handleDelete = (e, item, idx) => {
    e.stopPropagation()
    // × on a pending replacement removes the pending file AND deletes the
    // underlying image — × always means "remove this slot from my proof set".
    if (item.isPending && item.original) {
      onRemovePending(item.pendingIndex)
      onDelete(item.original)
    } else if (item.isPending) {
      onRemovePending(item.pendingIndex)
    } else {
      onDelete(item.original)
    }
    if (!controlled && previewIndex === idx) setPreviewIndex(null)
  }

  const handleReplace = (e, item) => {
    e.stopPropagation()
    const file = e.target.files?.[0]
    if (file && onReplace) {
      onReplace(item.original, file)
    }
    e.target.value = ''
  }

  const handleFileSelect = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onUpload(Array.from(files))
    }
    e.target.value = ''
  }

  // Compact empty state: just show upload button inline
  if (allItems.length === 0) {
    if (readOnly || disabled) {
      return <div className="proof-empty-hint">No proof photos</div>
    }
    return (
      <div className="proof-empty-row">
        <span className="proof-empty-hint">No proof photos</span>
        <label className="proof-upload-btn proof-upload-btn-sm">
          {uploading ? 'Uploading...' : '+ Add Photo'}
          <input
            type="file"
            accept="image/jpeg,image/png,image/heic,image/webp"
            multiple
            onChange={handleFileSelect}
            disabled={uploading || disabled}
            style={{ display: 'none' }}
          />
        </label>
      </div>
    )
  }

  return (
    <div className="proof-images-section">
      <div className="proof-images-header">
        <span className="proof-images-label">
          Proof ({allItems.length})
        </span>
        {!readOnly && !disabled && (
          <label className="proof-upload-btn">
            {uploading ? 'Uploading...' : '+ Add'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/heic,image/webp"
              multiple
              onChange={handleFileSelect}
              disabled={uploading || disabled}
              style={{ display: 'none' }}
            />
          </label>
        )}
      </div>

      <div className="proof-thumbnails">
        {allItems.map((item, idx) => (
          <div
            key={item.original ? (item.original.path || `idx-${idx}`) : `pending-${item.pendingIndex}`}
            className={`proof-thumbnail${item.isPending ? ' proof-thumbnail-pending' : ''}`}
          >
            <img
              src={item.url}
              alt={item.name}
              onClick={() => (controlled ? onOpenPreview(idx) : setPreviewIndex(idx))}
            />
            {item.isPending && <span className="proof-pending-badge">Pending</span>}
            {!readOnly && !disabled && item.original && (
              <label
                className="proof-replace-btn"
                title="Replace image"
                onClick={(e) => e.stopPropagation()}
              >
                &#8635;
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/heic,image/webp"
                  onChange={(e) => handleReplace(e, item)}
                  style={{ display: 'none' }}
                />
              </label>
            )}
            {!readOnly && !disabled && (
              <button
                className="proof-delete-btn"
                onClick={(e) => handleDelete(e, item, idx)}
                title={item.isPending && !item.original ? 'Remove (not yet saved)' : 'Delete image'}
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>

      {previewItem && createPortal(
        <div className="proof-preview-overlay" onClick={() => setPreviewIndex(null)}>
          <div className="proof-preview-content" onClick={e => e.stopPropagation()}>
            <button className="proof-preview-close" onClick={() => setPreviewIndex(null)}>
              &times;
            </button>
            {allItems.length > 1 && (
              <>
                <button className="proof-preview-nav proof-preview-prev" onClick={goToPrev}>&#8249;</button>
                <button className="proof-preview-nav proof-preview-next" onClick={goToNext}>&#8250;</button>
              </>
            )}
            <img src={previewItem.url} alt={previewItem.name} />
            <div className="proof-preview-info">
              {allItems.length > 1 && (
                <span className="proof-preview-counter">{previewIndex + 1} / {allItems.length}</span>
              )}
              <span>{previewItem.name}</span>
              {previewItem.isPending && <span className="proof-preview-pending-note">Not saved yet</span>}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
