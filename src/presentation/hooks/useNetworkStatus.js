import { useState, useEffect } from 'react'

// Tracks browser connectivity via navigator.onLine and online/offline events.
export function useOnlineStatus() {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  )

  useEffect(() => {
    const goOnline = () => setOnline(true)
    const goOffline = () => setOnline(false)
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return online
}

// Returns true once `active` has stayed true for at least `delayMs`.
// Used to detect a load that hangs past a reasonable threshold — a strong
// signal of a network problem even when navigator.onLine reports "online"
// (captive portals, unreachable server, dropped requests Firestore silently queues).
export function useStalledFlag(active, delayMs) {
  const [stalled, setStalled] = useState(false)

  useEffect(() => {
    if (!active) return
    const id = setTimeout(() => setStalled(true), delayMs)
    return () => {
      clearTimeout(id)
      setStalled(false)
    }
  }, [active, delayMs])

  return active && stalled
}
