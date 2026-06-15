export function safeRedirect(value, fallback = '/home') {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }

  try {
    const url = new URL(value, window.location.origin)
    return url.origin === window.location.origin ? value : fallback
  } catch {
    return fallback
  }
}
