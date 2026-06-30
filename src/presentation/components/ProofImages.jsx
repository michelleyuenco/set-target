import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './ProofImages.module.css'
import { downloadImage } from '../utils/downloadImage'

const FLIP_MS = 240

export function ProofImages({
  images = [],
  pendingFiles = [],
  pendingDeletePaths = [],
  onUpload,
  onDelete,
  onReplace,
  onRemovePending,
  onReorder,
  uploading,
  disabled,
  readOnly,
  onOpenPreview
}) {
  const controlled = typeof onOpenPreview === 'function'
  const [previewIndex, setPreviewIndex] = useState(null)

  // Pointer-based drag reorder (works for touch + mouse; no HTML5 DnD, which
  // is dead on iOS). Only saved images are draggable — their array order is the
  // persisted order, so reordering it is all that's needed for Save to honor it.
  const canReorder = typeof onReorder === 'function' && !readOnly && !disabled
  const dragState = useRef(null)
  const suppressClick = useRef(false)
  const [dragPath, setDragPath] = useState(null)
  const [dragOverPath, setDragOverPath] = useState(null)

  // FLIP: when tiles change slot, slide them from their old position to the new
  // one instead of jumping. offsetLeft/Top are layout coords unaffected by any
  // in-flight transform, so overlapping animations stay correct.
  const tileEls = useRef(new Map())
  const prevPos = useRef(new Map())
  const setTileRef = (key) => (el) => {
    if (el) tileEls.current.set(key, el)
    else tileEls.current.delete(key)
  }

  useLayoutEffect(() => {
    const next = new Map()
    tileEls.current.forEach((el, key) => {
      const pos = { left: el.offsetLeft, top: el.offsetTop }
      next.set(key, pos)
      const old = prevPos.current.get(key)
      if (!old) return
      const dx = old.left - pos.left
      const dy = old.top - pos.top
      if (!dx && !dy) return
      el.style.transition = 'none'
      el.style.transform = `translate(${dx}px, ${dy}px)`
      void el.offsetWidth // flush the inverted start position before animating
      requestAnimationFrame(() => {
        el.style.transition = `transform ${FLIP_MS}ms ease`
        el.style.transform = ''
      })
    })
    prevPos.current = next
  })

  // Resolve the drop target by hit-testing each draggable tile's rect directly.
  // document.elementFromPoint is unreliable on iOS while a pointer is captured
  // (returns the capturing element / null), which broke drags spanning rows.
  // `hit` = tile under the pointer; `nearest` = closest by center, used as a
  // fallback so releasing in a row's empty space still drops onto a tile.
  const tileTarget = (x, y) => {
    let hit = null
    let nearest = null
    let nearestDist = Infinity
    tileEls.current.forEach((el) => {
      const path = el.getAttribute('data-proof-path')
      if (!path) return
      const r = el.getBoundingClientRect()
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) hit = path
      const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2))
      if (d < nearestDist) { nearestDist = d; nearest = path }
    })
    return { hit, nearest }
  }

  const reorderTo = (fromPath, toPath) => {
    if (!fromPath || !toPath || fromPath === toPath) return
    const from = images.findIndex(i => i.path === fromPath)
    const to = images.findIndex(i => i.path === toPath)
    if (from < 0 || to < 0) return
    const next = [...images]
    const [moved] = next.splice(from, 1)
    next.splice(to, 0, moved)
    onReorder(next)
  }

  const handlePointerDown = (e, item) => {
    suppressClick.current = false
    if (!canReorder || item.isPending) return
    if (e.target.closest('button, label, input')) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    // Capture immediately so a vertical drag across rows can't be hijacked by a
    // scroll/swipe gesture (which would fire pointercancel and lose the drag).
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* best-effort */ }
    dragState.current = {
      path: item.original.path,
      startX: e.clientX,
      startY: e.clientY,
      moved: false
    }
  }

  const handlePointerMove = (e) => {
    const st = dragState.current
    if (!st) return
    if (!st.moved) {
      if (Math.hypot(e.clientX - st.startX, e.clientY - st.startY) < 6) return
      st.moved = true
      setDragPath(st.path)
    }
    setDragOverPath(tileTarget(e.clientX, e.clientY).hit)
  }

  const endDrag = () => {
    dragState.current = null
    setDragPath(null)
    setDragOverPath(null)
  }

  const handlePointerUp = (e) => {
    const st = dragState.current
    if (st && st.moved) {
      const { hit, nearest } = tileTarget(e.clientX, e.clientY)
      reorderTo(st.path, hit || nearest)
      suppressClick.current = true
    }
    endDrag()
  }

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
          const draggable = canReorder && !item.isPending
          const isDragging = draggable && dragPath === item.original.path
          const isDragOver = draggable && dragOverPath === item.original.path && dragPath && dragPath !== item.original.path
          const openPreview = () => {
            if (suppressClick.current) { suppressClick.current = false; return }
            controlled ? onOpenPreview(idx) : setPreviewIndex(idx)
          }
          return (
            <div
              key={tileKey}
              ref={setTileRef(tileKey)}
              data-proof-path={draggable ? item.original.path : undefined}
              className={`proof-thumbnail${
                item.isPending ? ' proof-thumbnail-pending' : ''
              }${item.pendingDelete ? ' proof-thumbnail-pending-delete' : ''
              }${item.pendingReplace ? ' proof-thumbnail-pending-replace' : ''
              }${draggable ? ' ' + styles.draggable : ''
              }${isDragging ? ' ' + styles.dragging : ''
              }${isDragOver ? ' ' + styles.dragOver : ''}`}
              onPointerDown={draggable ? (e) => handlePointerDown(e, item) : undefined}
              onPointerMove={draggable ? handlePointerMove : undefined}
              onPointerUp={draggable ? handlePointerUp : undefined}
              onPointerCancel={draggable ? endDrag : undefined}
            >
              <img
                src={item.url}
                alt={item.name}
                onClick={openPreview}
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
            <button
              className="proof-preview-download"
              title="Save image to device"
              aria-label="Save image to device"
              onClick={(e) => { e.stopPropagation(); downloadImage(previewItem.url, previewItem.name) }}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 3v12" /><path d="m7 10 5 5 5-5" /><path d="M5 21h14" />
              </svg>
            </button>
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
