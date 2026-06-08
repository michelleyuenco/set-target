import styles from './OfflineBanner.module.css'

export function OfflineBanner() {
  return (
    <div className={styles.banner} role="status">
      <span className={styles.dot} aria-hidden="true" />
      No internet connection &mdash; changes may not be saved
    </div>
  )
}
