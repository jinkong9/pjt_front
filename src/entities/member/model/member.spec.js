import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useMemberStore } from './member'
import { api } from '@/shared/api/client'
import { getAccessToken } from '@/shared/api/authToken'

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
  },
}))

describe('member store JWT auth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    localStorage.clear()
    document.cookie = 'happyhome.accessToken=; path=/; max-age=0'
    document.cookie = 'happyhome.refreshToken=; path=/; max-age=0'
    document.cookie = 'happyhome.grantType=; path=/; max-age=0'
    vi.clearAllMocks()
  })

  it('stores JWT tokens and keeps only the member object as current user on login', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        grantType: 'Bearer',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        member: { userId: 'ssafy', name: '싸피' },
      },
    })
    const memberStore = useMemberStore()

    await expect(memberStore.login({ userId: 'ssafy', password: '1234' })).resolves.toEqual({
      userId: 'ssafy',
      name: '싸피',
    })

    expect(getAccessToken()).toBe('access-token')
    expect(memberStore.current).toEqual({ userId: 'ssafy', name: '싸피' })
  })

  it('clears JWT tokens on logout', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        grantType: 'Bearer',
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        member: { userId: 'ssafy' },
      },
    })
    api.post.mockResolvedValueOnce({})
    const memberStore = useMemberStore()
    await memberStore.login({ userId: 'ssafy', password: '1234' })

    await memberStore.logout()

    expect(getAccessToken()).toBe('')
    expect(memberStore.current).toBeNull()
  })
})
