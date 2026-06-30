// Save a (likely cross-origin Firebase Storage) image to the device. Fetching
// the bytes into a blob lets the `download` attribute force a real save instead
// of a navigation. If the fetch is blocked (e.g. bucket CORS not configured),
// fall back to opening the image so the user can save it manually — on mobile,
// long-press → "Save Image".
export async function downloadImage(url, filename) {
  const name = filename || 'proof-image'
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    triggerDownload(objectUrl, name)
    setTimeout(() => URL.revokeObjectURL(objectUrl), 10000)
  } catch {
    window.open(url, '_blank', 'noopener')
  }
}

function triggerDownload(href, filename) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
}
