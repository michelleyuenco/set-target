import styles from './LoadingScreen.module.css'

export function LoadingScreen({ online, stalled, onRetry }) {
  const networkProblem = !online || stalled

  if (!networkProblem) {
    return <div className={styles.loading}>Loading...</div>
  }

  return (
    <div className={styles.networkError}>
      <div className={styles.icon} aria-hidden="true">&#128246;</div>
      <h2 className={styles.title}>Connection problem</h2>
      <p className={styles.message}>
        {online
          ? "We can't reach the server right now. This is usually a network problem — check your connection and try again."
          : 'You appear to be offline. Check your internet connection and try again.'}
      </p>
      <button className={styles.retry} onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}
