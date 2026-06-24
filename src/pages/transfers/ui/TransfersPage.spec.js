import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

import TransfersPage from './TransfersPage.vue'
import { fetchTransfers, toggleFavoriteTransfer } from '@/entities/transfer/api/transferApi'

vi.mock('@/entities/transfer/api/transferApi', () => ({
  fetchTransfers: vi.fn(),
  toggleFavoriteTransfer: vi.fn(),
}))

describe('TransfersPage layout', () => {
  it('renders wider transfer cards with a fixed full-width landscape image frame', async () => {
    fetchTransfers.mockResolvedValue([
      {
        transferId: 1,
        title: '서울시 관악구 원룸 양도합니다.',
        address: '서울시 관악구',
        detailAddress: '봉천동 119-12 101호',
        status: '양도가능',
        imageUrls: ['/uploads/room.jpg'],
        depositAmount: 2000,
        monthlyRentAmount: 50,
        maintenanceFee: 5,
        transferFee: 0,
        moveInDate: '2026-06-24',
        contractEndDate: '2026-12-14',
        exclusiveArea: '23.4m²',
        floor: '1층',
      },
    ])
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/transfers', component: TransfersPage },
        { path: '/transfers/:transferId', component: { template: '<div />' } },
      ],
    })
    await router.push('/transfers')
    await router.isReady()

    const wrapper = mount(TransfersPage, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    const gridClasses = wrapper.get('[data-testid="transfer-card-grid"]').classes()
    expect(gridClasses).toContain('md:grid-cols-2')
    expect(gridClasses).toContain('xl:grid-cols-3')

    const imageFrameClasses = wrapper.get('[data-testid="transfer-card-image-1"]').classes()
    expect(imageFrameClasses).toContain('m-0')
    expect(imageFrameClasses).toContain('aspect-[16/10]')

    const imageClasses = wrapper.get('[data-testid="transfer-card-image-1"] img').classes()
    expect(imageClasses).toContain('!h-full')
    expect(imageClasses).toContain('object-cover')
  })

  it('toggles a favorite from a transfer card', async () => {
    fetchTransfers.mockResolvedValue([
      {
        transferId: 1,
        title: '서울시 관악구 원룸 양도합니다.',
        address: '서울시 관악구',
        detailAddress: '봉천동 119-12 101호',
        status: '양도가능',
        imageUrls: ['/uploads/room.jpg'],
        depositAmount: 2000,
        monthlyRentAmount: 50,
      },
    ])
    toggleFavoriteTransfer.mockResolvedValue({ favorite: true })
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/transfers', component: TransfersPage },
        { path: '/transfers/:transferId', component: { template: '<div />' } },
      ],
    })
    await router.push('/transfers')
    await router.isReady()

    const wrapper = mount(TransfersPage, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    await wrapper.get('[data-testid="transfer-favorite-1"]').trigger('click')
    await flushPromises()

    expect(toggleFavoriteTransfer).toHaveBeenCalledWith(1)
    expect(wrapper.get('[data-testid="transfer-favorite-1"]').text()).toContain('관심중')
    expect(wrapper.text()).toContain('관심 매물로 등록했습니다.')
  })
})
