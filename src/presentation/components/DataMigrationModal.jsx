import { useState, useRef } from 'react'
import { DataMigrationService } from '../../application/services/DataMigrationService'
import { getFirestoreRepository, getLocalGoalService } from '../../di/container'

export function DataMigrationModal({ onComplete, onClose }) {
  const [status, setStatus] = useState(null) // null | 'syncing' | 'uploading' | 'done' | 'error'
  const [message, setMessage] = useState('')
  const fileInputRef = useRef(null)

  const localService = getLocalGoalService()
  const localData = localService.goalRepository.getRawData()
  const hasLocalData = Object.keys(localData).length > 0

  const handleSyncLocal = async () => {
    setStatus('syncing')
    setMessage('Syncing local data to your account...')
    try {
      const firestoreRepo = getFirestoreRepository()
      const localRepo = localService.goalRepository
      const count = await DataMigrationService.syncLocalToFirestore(localRepo, firestoreRepo)
      setStatus('done')
      setMessage(`Synced ${count} records to your account.`)
      setTimeout(() => onComplete(), 1500)
    } catch (err) {
      setStatus('error')
      setMessage(`Sync failed: ${err.message}`)
    }
  }

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setStatus('uploading')
    setMessage('Importing file...')
    try {
      const firestoreRepo = getFirestoreRepository()
      const count = await DataMigrationService.importFileToFirestore(file, firestoreRepo)
      setStatus('done')
      setMessage(`Imported ${count} records from file.`)
      setTimeout(() => onComplete(), 1500)
    } catch (err) {
      setStatus('error')
      setMessage(`Import failed: ${err.message}`)
    }
  }

  const handleSkip = () => {
    onComplete()
  }

  const isWorking = status === 'syncing' || status === 'uploading'

  return (
    <div className="modal-overlay">
      <div className="modal migration-modal" onClick={e => e.stopPropagation()}>
        <h2>Welcome! Set Up Your Data</h2>
        <p className="migration-description">
          Choose how to load your shift records into your account.
        </p>

        {message && (
          <div className={`migration-message ${status}`}>
            {message}
          </div>
        )}

        <div className="migration-options">
          {hasLocalData && (
            <button
              className="migration-option-btn"
              onClick={handleSyncLocal}
              disabled={isWorking}
            >
              <div className="option-title">Sync Local Data</div>
              <div className="option-desc">
                Upload {Object.keys(localData).length} records from this browser
              </div>
            </button>
          )}

          <button
            className="migration-option-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isWorking}
          >
            <div className="option-title">Upload Export File</div>
            <div className="option-desc">Import a previously exported JSON file</div>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          <button
            className="migration-option-btn skip-btn"
            onClick={handleSkip}
            disabled={isWorking}
          >
            <div className="option-title">Skip</div>
            <div className="option-desc">Start fresh with an empty account</div>
          </button>
        </div>

        {status === 'error' && (
          <div className="button-group">
            <button className="cancel-btn" onClick={onClose}>Close</button>
          </div>
        )}
      </div>
    </div>
  )
}
