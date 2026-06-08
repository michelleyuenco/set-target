import { useState } from 'react'
import styles from './AutoHideHeader.module.css'

export function AutoHideHeader({ children }) {
  const [pinned, setPinned] = useState(false)

  return (
    <>
      <div className={`${styles.autohide} ${pinned ? styles.pinned : ''}`}>
        <div className={styles.hotzone} aria-hidden="true" />
        <div className={styles.panel}>
          {children}
          <button
            type="button"
            className={styles.tab}
            onClick={() => setPinned((p) => !p)}
            aria-pressed={pinned}
            title={pinned ? 'Unpin toolbar (auto-hide)' : 'Pin toolbar open'}
            aria-label={pinned ? 'Unpin toolbar' : 'Pin toolbar open'}
          >
            <span className={styles.chevron} aria-hidden="true">⌄</span>
          </button>
        </div>
      </div>
      <div className={styles.spacer} aria-hidden="true" />
    </>
  )
}
