const ACCESS_TOKEN_KEY = 'happyhome.accessToken'
const REFRESH_TOKEN_KEY = 'happyhome.refreshToken'
const GRANT_TYPE_KEY = 'happyhome.grantType'
const AUTH_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function storage() {
  return typeof localStorage === 'undefined' ? null : localStorage
}

function readCookie(name) {
  if (typeof document === 'undefined') return ''
  const encodedName = `${encodeURIComponent(name)}=`
  return (
    document.cookie
      .split('; ')
      .find((row) => row.startsWith(encodedName))
      ?.slice(encodedName.length) || ''
  )
}

function writeCookie(name, value) {
  if (typeof document === 'undefined') return
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`
}

function removeCookie(name) {
  if (typeof document === 'undefined') return
  document.cookie = `${encodeURIComponent(name)}=; path=/; max-age=0; SameSite=Lax`
}

export function getAccessToken() {
  return decodeURIComponent(readCookie(ACCESS_TOKEN_KEY)) || storage()?.getItem(ACCESS_TOKEN_KEY) || ''
}

export function saveAuthToken(tokenResponse = {}) {
  const targetStorage = storage()

  if (tokenResponse.accessToken) {
    targetStorage?.setItem(ACCESS_TOKEN_KEY, tokenResponse.accessToken)
    writeCookie(ACCESS_TOKEN_KEY, tokenResponse.accessToken)
  }
  if (tokenResponse.refreshToken) {
    targetStorage?.setItem(REFRESH_TOKEN_KEY, tokenResponse.refreshToken)
    writeCookie(REFRESH_TOKEN_KEY, tokenResponse.refreshToken)
  }
  if (tokenResponse.grantType) {
    targetStorage?.setItem(GRANT_TYPE_KEY, tokenResponse.grantType)
    writeCookie(GRANT_TYPE_KEY, tokenResponse.grantType)
  }
}

export function clearAuthToken() {
  const targetStorage = storage()

  targetStorage?.removeItem(ACCESS_TOKEN_KEY)
  targetStorage?.removeItem(REFRESH_TOKEN_KEY)
  targetStorage?.removeItem(GRANT_TYPE_KEY)
  removeCookie(ACCESS_TOKEN_KEY)
  removeCookie(REFRESH_TOKEN_KEY)
  removeCookie(GRANT_TYPE_KEY)
}
