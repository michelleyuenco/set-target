import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

export function ProofImages({
  images = [],
  pendingFiles = [],
  pendingDeletePaths = [],
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

  // Pending files split into two kinds: replacements (paired with the original
  // they replace via `replacingPath`) and pure additions (appended at end).
  const replacementsByPath = new Map()
  const additions = []
  pendingFiles.forEach((pf, i) => {
    const tagged = { ...pf, pendingIndex: i }
    if (pf.replacingPath) replacementsByPath.set(pf.replacingPath, tagged)
    else additions.push(tagged)
  })

  // Originals stay in their slot (tagged pendingDelete/pendingReplace as needed).
  // A pending replacement renders as a separate tile right after its original.
  const allItems = []
  images.forEach(img => {
    const pendingDelete = pendingDeletePaths.includes(img.path)
    const r = replacementsByPath.get(img.path)
    allItems.push({
      url: img.url,
      name: img.name,
      isPending: false,
      pendingDelete,
      pendingReplace: !!r && !pendingDelete,
      original: img
    })
    if (r && !pendingDelete) {
      allItems.push({
        url: r.localUrl,
        name: r.name,
        isPending: true,
        isReplacement: true,
        pendingIndex: r.pendingIndex,
        original: img
      })
    }
  })
  additions.forEach(pf => {
    allItems.push({
      url: pf.localUrl,
      name: pf.name,
      isPending: true,
      pendingIndex: pf.pendingIndex
    })
  })

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
    // × on the new replacement tile cancels the pending file (keeps original).
    // × on a pure pending addition removes the staged file.
    // × on an uploaded original toggles the pending-deletion mark — Save will
    // commit the storage delete; clicking × again before Save undoes the mark.
    if (item.isPending) {
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
        {allItems.map((item, idx) => {
          const tileKey = item.isReplacement
            ? `replacement-${item.pendingIndex}`
            : item.isPending
              ? `pending-${item.pendingIndex}`
              : (item.original?.path || `idx-${idx}`)
          const showReplaceBtn = !readOnly && !disabled && !item.isPending && !item.pendingDelete && !item.pendingReplace
          const showDeleteBtn = !readOnly && !disabled
          const deleteTitle = item.pendingDelete
            ? 'Undo delete'
            : item.isReplacement
              ? 'Cancel replacement'
              : item.isPending
                ? 'Remove (not yet saved)'
                : 'Delete image'
          return (
            <div
              key={tileKey}
              className={`proof-thumbnail${
                item.isPending ? ' proof-thumbnail-pending' : ''
              }${item.pendingDelete ? ' proof-thumbnail-pending-delete' : ''
              }${item.pendingReplace ? ' proof-thumbnail-pending-replace' : ''}`}
            >
              <img
                src={item.url}
                alt={item.name}
                onClick={() => (controlled ? onOpenPreview(idx) : setPreviewIndex(idx))}
              />
              {item.pendingDelete && <span className="proof-pending-delete-badge">Pending Delete</span>}
              {item.pendingReplace && <span className="proof-pending-replace-badge">To be replaced</span>}
              {item.isPending && item.isReplacement && <span className="proof-pending-badge">New</span>}
              {item.isPending && !item.isReplacement && <span className="proof-pending-badge">Pending</span>}
              {showReplaceBtn && (
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
              {showDeleteBtn && (
                <button
                  className={`proof-delete-btn${item.pendingDelete ? ' proof-delete-btn-undo' : ''}`}
                  onClick={(e) => handleDelete(e, item, idx)}
                  title={deleteTitle}
                >
                  {item.pendingDelete ? <>&#8634;</> : <>&times;</>}
                </button>
              )}
            </div>
          )
        })}
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
              {previewItem.pendingDelete && <span className="proof-preview-pending-note">Will be deleted on save</span>}
              {previewItem.pendingReplace && <span className="proof-preview-pending-note">Will be replaced on save</span>}
              {previewItem.isReplacement && <span className="proof-preview-pending-note">New replacement — not saved yet</span>}
              {previewItem.isPending && !previewItem.isReplacement && <span className="proof-preview-pending-note">Not saved yet</span>}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
