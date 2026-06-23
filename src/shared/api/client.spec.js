import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from './client'
import { clearAuthToken, saveAuthToken } from './authToken'

describe('api client auth', () => {
  beforeEach(() => {
    localStorage.clear()
    document.cookie = 'happyhome.accessToken=; path=/; max-age=0'
    document.cookie = 'happyhome.refreshToken=; path=/; max-age=0'
    document.cookie = 'happyhome.grantType=; path=/; max-age=0'
  })

  it('adds Authorization Bearer header when an access token exists', async () => {
    saveAuthToken({ grantType: 'Bearer', accessToken: 'access-token' })
    const adapter = vi.fn((config) =>
      Promise.resolve({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    )

    await api.get('/members/me', { adapter })

    expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer access-token')
  })

  it('does not add Authorization header for public rental notice requests', async () => {
    saveAuthToken({ grantType: 'Bearer', accessToken: 'stale-token' })
    const adapter = vi.fn((config) =>
      Promise.resolve({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    )

    await api.get('/rentals', { adapter })

    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined()
  })

  it('stores tokens in cookies for browser session visibility', () => {
    saveAuthToken({ grantType: 'Bearer', accessToken: 'access-token', refreshToken: 'refresh-token' })

    expect(document.cookie).toContain('happyhome.accessToken=access-token')
    expect(document.cookie).toContain('happyhome.refreshToken=refresh-token')
    expect(document.cookie).toContain('happyhome.grantType=Bearer')
  })

  it('does not add Authorization header after tokens are cleared', async () => {
    saveAuthToken({ grantType: 'Bearer', accessToken: 'access-token' })
    clearAuthToken()
    const adapter = vi.fn((config) =>
      Promise.resolve({
        data: {},
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      }),
    )

    await api.get('/members/me', { adapter })

    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined()
  })

  it('clears stored tokens after a protected request receives 401', async () => {
    saveAuthToken({ grantType: 'Bearer', accessToken: 'expired-token', refreshToken: 'refresh-token' })
    const adapter = vi.fn((config) =>
      Promise.reject({
        response: { status: 401 },
        config,
      }),
    )

    await expect(api.get('/members/me', { adapter })).rejects.toBeTruthy()

    expect(localStorage.getItem('happyhome.accessToken')).toBeNull()
    expect(localStorage.getItem('happyhome.refreshToken')).toBeNull()
  })
})
