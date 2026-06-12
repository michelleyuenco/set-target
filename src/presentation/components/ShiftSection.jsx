import { ProofImages } from './ProofImages'
import { ShiftExtrasFold } from './ShiftExtrasFold'

export function ShiftSection({ shift, ctx }) {
  const fieldsDisabled = ctx.readOnly || !shift.confirmed || shift.locked
  const adminFieldsDisabled = ctx.readOnly || shift.locked

  return (
    <div className="shift-group">
      <div
        className={`shift-confirm-toggle${ctx.contentOverflows ? ` shift-confirm-sticky ${shift.stickyClass}` : ''}${!shift.confirmed ? ' shift-toggle-dimmed' : ''}`}
        onClick={ctx.contentOverflows ? (e) => {
          // Only scroll to top if clicking the header bar itself, not child buttons/labels
          if (e.target === e.currentTarget) {
            ctx.modalRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
          }
        } : undefined}
      >
        <label className="shift-confirm">
          <input
            type="checkbox"
            checked={shift.confirmed}
            onChange={(e) => {
              shift.setConfirmed(e.target.checked)
              if (e.target.checked && !shift.location) {
                shift.setLocation(shift.fallbackLocation || ctx.autoLocation || null)
              }
            }}
            disabled={ctx.readOnly || shift.locked}
          />
          <span>{shift.label}</span>
        </label>
        {shift.confirmed && shift.adminConfirmed && (
          <span className="shift-verified-tag"><span className="verified-icon">&#10003;</span><span className="verified-text"> Verified</span></span>
        )}
        {ctx.isAdminViewing && shift.confirmed && (
          shift.adminConfirmed ? (
            <button className="admin-unconfirm-btn" onClick={() => ctx.onUnconfirmShift(shift.key)}>Undo</button>
          ) : (
            ctx.hasChanges
              ? <span className="shift-save-first-hint" onClick={ctx.onSave}>Save before verify</span>
              : <button className="admin-confirm-btn shift-verify-btn" onClick={() => ctx.onConfirmShift(shift.key)}>&#10003; Verify</button>
          )
        )}
      </div>
      <div className={`shift-section-wrapper ${!shift.confirmed ? 'shift-unconfirmed' : ''}`}>
        <div className="shift-row">
          <div className={`shift-inputs${/[+\-*/]/.test(String(shift.actualInput)) ? ' actual-expanded' : ''}`}>
            <div className="input-compact">
              <label>Target</label>
              <input
                type="number"
                value={shift.goalValue}
                onChange={(e) => shift.setGoalValue(e.target.value)}
                placeholder="0"
                disabled={fieldsDisabled}
              />
            </div>
            <div className="input-compact input-compact-actual">
              <label>Actual</label>
              <div className="actual-input-wrapper">
                <textarea
                  rows="1"
                  inputMode="decimal"
                  value={shift.actualInput}
                  onChange={(e) => {
                    shift.setActualInput(e.target.value)
                    const result = ctx.evaluateFormula(e.target.value)
                    if (result !== null) shift.setActual(String(result))
                    ctx.autoResize(e.target)
                  }}
                  onBlur={() => ctx.handleActualBlur(shift.actualInput, shift.setActual)}
                  onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault() }}
                  ref={(el) => ctx.autoResize(el)}
                  placeholder="0"
                  disabled={fieldsDisabled}
                />
                <button
                  type="button"
                  className="actual-add-btn"
                  aria-label="Add"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => shift.setActualInput((prev) => (prev || '') + '+')}
                  disabled={fieldsDisabled}
                >+</button>
              </div>
              {ctx.formulaPreview(shift.actualInput) !== null && (
                <div className="formula-preview">= {ctx.formulaPreview(shift.actualInput)}</div>
              )}
            </div>
            <div className={`wage-compact ${ctx.wageClass(shift.wage, shift.customWage)}`}>
              ${shift.wage}/hr
            </div>
          </div>
        </div>
        <div className="shift-time-row">
          <div className="time-input-group">
            <label>Start</label>
            <input
              type="time"
              value={shift.startTime}
              onChange={(e) => shift.setStartTime(e.target.value)}
              disabled={fieldsDisabled}
            />
          </div>
          <div className="time-input-group">
            <label>End</label>
            <input
              type="time"
              value={shift.endTime}
              onChange={(e) => shift.setEndTime(e.target.value)}
              disabled={fieldsDisabled}
            />
          </div>
          <div className="shift-duration">
            {ctx.formatHours(shift.hours)}
          </div>
        </div>
        {shift.confirmed && ctx.locations && ctx.locations.length > 0 && (
          <div className="shift-location-row">
            <label>Location</label>
            <select
              className="location-select"
              value={shift.location || ''}
              onChange={(e) => shift.setLocation(e.target.value || null)}
              disabled={adminFieldsDisabled}
            >
              <option value="">— None —</option>
              {ctx.locations.map((loc) => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>
        )}
        <ShiftExtrasFold
          expanded={shift.extrasExpanded}
          onToggle={shift.onToggleExtras}
          chips={shift.extrasChips}
          dimmed={!shift.confirmed}
          showIg={shift.showIg}
          setShowIg={shift.setShowIg}
          igFeatured={shift.igFeatured}
          setIgFeatured={shift.setIgFeatured}
          igOther={shift.igOther}
          setIgOther={shift.setIgOther}
          showCustom={shift.showCustom}
          setShowCustom={shift.setShowCustom}
          customRate={shift.customRate}
          setCustomRate={shift.setCustomRate}
          customAmount={shift.customAmount}
          setCustomAmount={shift.setCustomAmount}
          showAdminFields={ctx.isAdminViewing && shift.confirmed}
          allowance={shift.allowance}
          setAllowance={shift.setAllowance}
          customWage={shift.customWage}
          setCustomWage={shift.setCustomWage}
          fieldsDisabled={fieldsDisabled}
          adminFieldsDisabled={adminFieldsDisabled}
        />
        <div className={`shift-proof-inline${!shift.confirmed ? ' shift-unconfirmed' : ''}`}>
          <ProofImages
            images={shift.proofImages}
            pendingFiles={shift.pendingFiles}
            pendingDeletePaths={shift.pendingDeletes}
            onUpload={(files) => ctx.onStageFiles(shift.key, files)}
            onDelete={(image) => ctx.onDeleteUploadedImage(shift.key, image)}
            onReplace={(oldImage, newFile) => ctx.onReplaceImage(shift.key, oldImage, newFile)}
            onRemovePending={(index) => ctx.onRemovePending(shift.key, index)}
            uploading={ctx.proofUploadingShift === shift.key}
            disabled={!shift.confirmed || shift.locked}
            readOnly={ctx.readOnly}
            onOpenPreview={(idx) => ctx.setPreviewIndex(shift.previewOffset + idx)}
          />
        </div>
      </div>
    </div>
  )
}
