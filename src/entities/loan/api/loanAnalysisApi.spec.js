import { describe, expect, it, vi } from 'vitest'
import { api } from '@/shared/api/client'
import { analyzePropertyLoan } from './loanAnalysisApi'

vi.mock('@/shared/api/client', () => ({
  api: {
    post: vi.fn(),
  },
}))

describe('loanAnalysisApi', () => {
  it('posts the selected deal and loan assumptions', async () => {
    const payload = { dealNo: 11, years: 30, rate: 4.2, repaymentType: 'EQUAL_PAYMENT' }
    api.post.mockResolvedValue({ data: { readiness: { feasibleNow: true } } })

    const result = await analyzePropertyLoan(payload)

    expect(api.post).toHaveBeenCalledWith('/loans/property-analysis', payload)
    expect(result.readiness.feasibleNow).toBe(true)
  })
})
