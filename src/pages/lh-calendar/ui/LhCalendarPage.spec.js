import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

import LhCalendarPage from './LhCalendarPage.vue'
import { fetchRentalNotices } from '@/entities/rental/api/rentalApi'

vi.mock('@/entities/rental/api/rentalApi', () => ({
  fetchRentalNotices: vi.fn(),
}))

function createTestRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/lh-calendar', component: LhCalendarPage },
      { path: '/rentals/:noticeId', component: { template: '<div />' } },
    ],
  })
}

describe('LhCalendarPage', () => {
  it('shows LH notice schedules on the month that has events', async () => {
    fetchRentalNotices.mockResolvedValue([
      {
        rentalNoticeId: 'LH-1',
        title: '서울 행복주택 입주자 모집',
        noticeDate: '2026.07.01',
        applyStartDate: '2026-07-05T09:00:00',
        applyEndDate: '20260712',
        closeDate: '2026-07-20',
      },
    ])
    const router = createTestRouter()
    await router.push('/lh-calendar')
    await router.isReady()

    const wrapper = mount(LhCalendarPage, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('2026년 7월')
    const firstEventText = wrapper.get('[data-testid="calendar-event"]').text()
    expect(firstEventText).toContain('공고일')
    expect(wrapper.text()).toContain('서울 행복주택 입주자 모집')
  })

  it('labels and color-codes application start and deadline events with a legend', async () => {
    fetchRentalNotices.mockResolvedValue([
      {
        rentalNoticeId: 'LH-START',
        title: '접수 시작 공고',
        applyStartDate: '2026-07-05',
      },
      {
        rentalNoticeId: 'LH-END',
        title: '접수 마감 공고',
        applyEndDate: '2026-07-06',
      },
    ])
    const router = createTestRouter()
    await router.push('/lh-calendar')
    await router.isReady()

    const wrapper = mount(LhCalendarPage, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    const legend = wrapper.get('[data-testid="calendar-legend"]')
    expect(legend.text()).toContain('접수시작')
    expect(legend.text()).toContain('접수마감')

    const events = wrapper.findAll('[data-testid="calendar-event"]')
    expect(events.map((event) => event.text())).toEqual(
      expect.arrayContaining([
        expect.stringContaining('접수시작'),
        expect.stringContaining('접수마감'),
      ]),
    )
    expect(events.find((event) => event.text().includes('접수시작')).classes().join(' ')).toContain('calendar-event-start')
    expect(events.find((event) => event.text().includes('접수마감')).classes().join(' ')).toContain('calendar-event-deadline')
  })

  it('limits day events to three and opens the rest in a modal', async () => {
    fetchRentalNotices.mockResolvedValue(
      Array.from({ length: 5 }, (_, index) => ({
        rentalNoticeId: `LH-${index + 1}`,
        title: `LH 공고 ${index + 1}`,
        noticeDate: '2026-07-01',
      })),
    )
    const router = createTestRouter()
    await router.push('/lh-calendar')
    await router.isReady()

    const wrapper = mount(LhCalendarPage, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    expect(wrapper.findAll('[data-testid="calendar-event"]')).toHaveLength(3)
    expect(wrapper.get('[data-testid="calendar-more"]').text()).toContain('2개 더 보기')

    await wrapper.get('[data-testid="calendar-more"]').trigger('click')

    expect(wrapper.get('[data-testid="calendar-day-modal"]').text()).toContain('LH 공고 5')
    const closeButton = wrapper.get('[data-testid="calendar-modal-close"]')
    expect(closeButton.classes().join(' ')).toContain('border-[#171717]')
  })
})
