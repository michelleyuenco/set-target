import { useState, useEffect, useCallback } from 'react'

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000

function isBuildStale() {
  return Date.now() - __BUILD_TIME__ > ONE_WEEK
}

function getCurrentScriptHash() {
  const script = document.querySelector('script[src*="/assets/index-"]')
  if (!script) return null
  const match = script.src.match(/\/assets\/index-([a-zA-Z0-9_-]+)\.js/)
  return match ? match[1] : null
}

async function fetchRemoteHash() {
  const res = await fetch('/index.html', { cache: 'no-store' })
  const html = await res.text()
  const match = html.match(/\/assets\/index-([a-zA-Z0-9_-]+)\.js/)
  return match ? match[1] : null
}

export function useUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [checked, setChecked] = useState(false)

  const check = useCallback(async () => {
    if (checked || !isBuildStale()) return
    try {
      const [current, remote] = await Promise.all([
        getCurrentScriptHash(),
        fetchRemoteHash()
      ])
      if (current && remote && current !== remote) {
        setUpdateAvailable(true)
      }
      setChecked(true)
    } catch {
      // ignore network errors
    }
  }, [checked])

  useEffect(() => {
    // Check on initial load if already stale
    check()

    // Check when user returns to the tab
    const onVisibility = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [check])

  const reload = useCallback(() => window.location.reload(), [])
  const dismiss = useCallback(() => setUpdateAvailable(false), [])

  return { updateAvailable, reload, dismiss }
}
