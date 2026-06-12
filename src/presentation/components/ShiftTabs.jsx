import styles from './ShiftTabs.module.css'

export function ShiftTabs({ tabs, activeKey, onChange }) {
  return (
    <div className={styles.tabs} role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={tab.key === activeKey}
          className={tab.key === activeKey ? `${styles.tab} ${styles.active}` : styles.tab}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
          {tab.badge === 'verified' && <span className={styles.badgeVerified}>&#10003;</span>}
          {tab.badge === 'attention' && <span className={styles.badgeAttention}>&bull;</span>}
        </button>
      ))}
    </div>
  )
}
