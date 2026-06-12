import styles from './ShiftExtrasFold.module.css'

export function ShiftExtrasFold({
  expanded, onToggle, chips = [], dimmed,
  showIg, setShowIg, igFeatured, setIgFeatured, igOther, setIgOther,
  showCustom, setShowCustom, customRate, setCustomRate, customAmount, setCustomAmount,
  showAdminFields, allowance, setAllowance, customWage, setCustomWage,
  fieldsDisabled, adminFieldsDisabled
}) {
  return (
    <div className={dimmed ? `${styles.fold} ${styles.dimmed}` : styles.fold}>
      <button type="button" className={styles.header} onClick={onToggle} aria-expanded={expanded}>
        <span className={styles.caret}>{expanded ? '▾' : '▸'}</span>
        <span>More options</span>
        {!expanded && chips.length > 0 && (
          <span className={styles.chips}>
            {chips.map((chip) => <span key={chip} className={styles.chip}>{chip}</span>)}
          </span>
        )}
      </button>
      {expanded && (
        <div className={styles.body}>
          <div className={styles.togglesRow}>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={showIg}
                disabled={fieldsDisabled}
                onChange={(e) => {
                  setShowIg(e.target.checked)
                  if (!e.target.checked) { setIgFeatured(''); setIgOther('') }
                }}
              />
              <span>IG Sales</span>
            </label>
            <label className={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={showCustom}
                disabled={fieldsDisabled}
                onChange={(e) => {
                  setShowCustom(e.target.checked)
                  if (!e.target.checked) { setCustomRate(''); setCustomAmount('') }
                }}
              />
              <span>Custom Comm.</span>
            </label>
          </div>
          {showIg && (
            <div className={`${styles.commissionInputs} ${styles.igInputs}`}>
              <div className="input-compact">
                <label>IG Featured ($)</label>
                <input
                  type="number"
                  value={igFeatured}
                  onChange={(e) => setIgFeatured(e.target.value)}
                  placeholder="0"
                  disabled={fieldsDisabled}
                />
              </div>
              <div className="input-compact">
                <label>IG Other ($)</label>
                <input
                  type="number"
                  value={igOther}
                  onChange={(e) => setIgOther(e.target.value)}
                  placeholder="0"
                  disabled={fieldsDisabled}
                />
              </div>
            </div>
          )}
          {showCustom && (
            <div className={styles.commissionInputs}>
              <div className="input-compact">
                <label>Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={customRate}
                  onChange={(e) => setCustomRate(e.target.value)}
                  placeholder="5"
                  disabled={fieldsDisabled}
                />
              </div>
              <div className="input-compact">
                <label>Amount ($)</label>
                <input
                  type="number"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="1000"
                  disabled={fieldsDisabled}
                />
              </div>
            </div>
          )}
          {showAdminFields && (
            <div className={styles.adminRow}>
              <div className={styles.adminField}>
                <label>Allowance ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={allowance}
                  onChange={(e) => setAllowance(e.target.value)}
                  placeholder="0"
                  disabled={adminFieldsDisabled}
                />
              </div>
              <div className={styles.adminField}>
                <label>Custom Wage ($/hr)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={customWage}
                  onChange={(e) => setCustomWage(e.target.value)}
                  placeholder="Auto"
                  disabled={adminFieldsDisabled}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
