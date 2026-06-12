import { useCallback, useSyncExternalStore } from 'react'

// Falls back to false (narrow layout) when matchMedia is unavailable.
export function useMediaQuery(query) {
  const subscribe = useCallback((onStoreChange) => {
    if (typeof window === 'undefined' || !window.matchMedia) return () => {}
    const mql = window.matchMedia(query)
    mql.addEventListener('change', onStoreChange)
    return () => mql.removeEventListener('change', onStoreChange)
  }, [query])
  const getSnapshot = () =>
    typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(query).matches : false
  return useSyncExternalStore(subscribe, getSnapshot, () => false)
}
