import axios from 'axios'
import { clearAuthToken, getAccessToken } from './authToken'

export function backendOrigin() {
  return (import.meta.env.VITE_BACKEND_ORIGIN || '').replace(/\/$/, '')
}

export function apiBaseUrl() {
  const origin = backendOrigin()
  return origin ? `${origin}/api` : '/api'
}

export const api = axios.create({
  baseURL: apiBaseUrl(),
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const accessToken = getAccessToken()
  if (accessToken && requiresAuth(config)) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      clearAuthToken()
    }
    return Promise.reject(error)
  },
)

function requiresAuth(config = {}) {
  const method = (config.method || 'get').toLowerCase()
  const path = pathFromUrl(config.url || '')

  if (path === '/members/me' || path.startsWith('/members/me/')) {
    return true
  }
  if (path.startsWith('/favorites')) {
    return true
  }
  if (path === '/rentals/favorites' || path === '/rentals/favorites/emails/send') {
    return true
  }
  if (path === '/rentals/recommendations/emails/send') {
    return true
  }
  if (method === 'post' && /^\/rentals\/[^/]+\/favorite\/toggle$/.test(path)) {
    return true
  }
  if (method === 'get' && path === '/rentals/recommendations') {
    return true
  }
  if (method === 'post' && path === '/loans/property-analysis') {
    return true
  }
  if (path === '/transfers/favorites') {
    return true
  }
  if (method === 'post' && /^\/transfers\/[^/]+\/favorite\/toggle$/.test(path)) {
    return true
  }
  if (['post', 'put', 'delete'].includes(method) && path.startsWith('/transfers')) {
    return true
  }
  return false
}

function pathFromUrl(url) {
  if (!url) {
    return ''
  }
  try {
    return new URL(url, 'http://happyhome.local/api').pathname.replace(/^\/api/, '') || '/'
  } catch {
    return url.split('?')[0].replace(/^\/api/, '')
  }
}

export function toQuery(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}
