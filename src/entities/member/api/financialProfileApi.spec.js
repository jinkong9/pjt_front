import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { getFinancialProfile, saveFinancialProfile } from './financialProfileApi'

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(),
    put: vi.fn(),
  },
}))

describe('financialProfileApi', () => {
  beforeEach(() => vi.clearAllMocks())

  it('loads the current member financial profile', async () => {
    api.get.mockResolvedValue({ data: { availableAssets: 100 } })

    const result = await getFinancialProfile()

    expect(api.get).toHaveBeenCalledWith('/members/me/financial-profile')
    expect(result.availableAssets).toBe(100)
  })

  it('saves the current member financial profile', async () => {
    const payload = { availableAssets: 100 }
    api.put.mockResolvedValue({ data: payload })

    await saveFinancialProfile(payload)

    expect(api.put).toHaveBeenCalledWith('/members/me/financial-profile', payload)
  })
})
