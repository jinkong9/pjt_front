import { describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'

import AnalysisPage from './AnalysisPage.vue'

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(),
  },
}))

describe('AnalysisPage segment buttons', () => {
  it('uses readable active segment colors without keeping the white background class', async () => {
    const wrapper = mount(AnalysisPage)

    const activeRadius = wrapper.get('[data-testid="analysis-radius-1000"]')
    expect(activeRadius.classes()).toContain('bg-[#b4212a]')
    expect(activeRadius.classes()).toContain('text-white')
    expect(activeRadius.classes()).not.toContain('bg-white')

    await wrapper.get('[data-testid="analysis-priority-commercial"]').trigger('click')

    const activePriority = wrapper.get('[data-testid="analysis-priority-commercial"]')
    expect(activePriority.classes()).toContain('bg-[#b4212a]')
    expect(activePriority.classes()).toContain('text-white')
    expect(activePriority.classes()).not.toContain('bg-white')
  })
})
