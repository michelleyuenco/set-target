import { useState, useEffect, useCallback } from 'react'

const CHECK_INTERVAL = 5 * 60 * 1000 // 5 minutes

export function useUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/', { cache: 'no-store' })
        const html = await res.text()
        // Look for a different build timestamp in the served HTML
        const match = html.match(/__BUILD_TIME__.*?(\d{13})/)
        if (match && Number(match[1]) !== __BUILD_TIME__) {
          setUpdateAvailable(true)
        }
      } catch {
        // ignore fetch errors
      }
    }

    const id = setInterval(check, CHECK_INTERVAL)
    return () => clearInterval(id)
  }, [])

  const reload = useCallback(() => {
    window.location.reload()
  }, [])

  const dismiss = useCallback(() => {
    setUpdateAvailable(false)
  }, [])

  return { updateAvailable, reload, dismiss }
}
