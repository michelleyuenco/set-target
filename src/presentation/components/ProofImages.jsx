import { useState } from 'react'

export function ProofImages({
  images = [],
  pendingFiles = [],
  onUpload,
  onDelete,
  onRemovePending,
  uploading,
  disabled,
  readOnly
}) {
  const [previewIndex, setPreviewIndex] = useState(null)

  // Combine uploaded + pending into one list for the lightbox
  const allItems = [
    ...images.map(img => ({ url: img.url, name: img.name, isPending: false, original: img })),
    ...pendingFiles.map((pf, i) => ({ url: pf.localUrl, name: pf.name, isPending: true, pendingIndex: i }))
  ]

  const previewItem = previewIndex !== null ? allItems[previewIndex] : null

  const goToPrev = (e) => {
    e.stopPropagation()
    setPreviewIndex(prev => (prev > 0 ? prev - 1 : allItems.length - 1))
  }

  const goToNext = (e) => {
    e.stopPropagation()
    setPreviewIndex(prev => (prev < allItems.length - 1 ? prev + 1 : 0))
  }

  const handleDelete = (e, item, idx) => {
    e.stopPropagation()
    if (item.isPending) {
      onRemovePending(item.pendingIndex)
      if (previewIndex === idx) setPreviewIndex(null)
    } else {
      onDelete(item.original)
      if (previewIndex === idx) setPreviewIndex(null)
    }
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
            key={item.isPending ? `pending-${item.pendingIndex}` : (item.original.path || idx)}
            className={`proof-thumbnail${item.isPending ? ' proof-thumbnail-pending' : ''}`}
          >
            <img
              src={item.url}
              alt={item.name}
              onClick={() => setPreviewIndex(idx)}
            />
            {item.isPending && <span className="proof-pending-badge">Pending</span>}
            {!readOnly && !disabled && (
              <button
                className="proof-delete-btn"
                onClick={(e) => handleDelete(e, item, idx)}
                title={item.isPending ? 'Remove (not yet saved)' : 'Delete image'}
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>

      {previewItem && (
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
        </div>
      )}
    </div>
  )
}
