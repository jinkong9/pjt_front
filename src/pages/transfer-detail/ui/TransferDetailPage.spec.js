import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'

import TransferDetailPage from './TransferDetailPage.vue'
import { fetchTransferDetail, toggleFavoriteTransfer } from '@/entities/transfer/api/transferApi'

vi.mock('@/entities/transfer/api/transferApi', () => ({
  deleteTransfer: vi.fn(),
  fetchTransferDetail: vi.fn(),
  toggleFavoriteTransfer: vi.fn(),
}))

describe('TransferDetailPage layout', () => {
  it('keeps the hero image in a landscape frame above the detail panels', async () => {
    fetchTransferDetail.mockResolvedValue({
      transferId: 1,
      title: '서울시 관악구 원룸 양도합니다.',
      content: 'A급입니다.',
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
      contactPhone: '010-8791-1753',
    })
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/transfers', component: { template: '<div />' } },
        { path: '/transfers/:transferId', component: TransferDetailPage },
        { path: '/transfers/:transferId/edit', component: { template: '<div />' } },
      ],
    })
    await router.push('/transfers/1')
    await router.isReady()

    const wrapper = mount(TransferDetailPage, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    const galleryClasses = wrapper.get('[data-testid="transfer-detail-gallery"]').classes()
    expect(galleryClasses).toContain('mb-8')
    expect(galleryClasses).not.toContain('lg:grid-cols-[2fr_1fr]')

    const heroClasses = wrapper.get('[data-testid="transfer-detail-hero-image"]').classes()
    expect(heroClasses).toContain('aspect-[16/9]')
    expect(heroClasses).toContain('h-auto')
    expect(heroClasses).toContain('overflow-hidden')

    const imageClasses = wrapper.get('[data-testid="transfer-detail-hero-image"] img').classes()
    expect(imageClasses).toContain('!h-full')
    expect(imageClasses).toContain('object-cover')

    expect(wrapper.get('[data-testid="transfer-detail-panels"]').classes()).toContain('mt-0')
  })

  it('toggles a favorite from the transfer detail header', async () => {
    fetchTransferDetail.mockResolvedValue({
      transferId: 1,
      title: '서울시 관악구 원룸 양도합니다.',
      content: 'A급입니다.',
      address: '서울시 관악구',
      detailAddress: '봉천동 119-12 101호',
      status: '양도가능',
      imageUrls: ['/uploads/room.jpg'],
      contactPhone: '010-8791-1753',
    })
    toggleFavoriteTransfer.mockResolvedValue({ favorite: true })
    const router = createRouter({
      history: createWebHistory(),
      routes: [
        { path: '/transfers', component: { template: '<div />' } },
        { path: '/transfers/:transferId', component: TransferDetailPage },
        { path: '/transfers/:transferId/edit', component: { template: '<div />' } },
      ],
    })
    await router.push('/transfers/1')
    await router.isReady()

    const wrapper = mount(TransferDetailPage, {
      global: {
        plugins: [router],
      },
    })
    await flushPromises()

    await wrapper.get('[data-testid="transfer-detail-favorite"]').trigger('click')
    await flushPromises()

    expect(toggleFavoriteTransfer).toHaveBeenCalledWith('1')
    expect(wrapper.get('[data-testid="transfer-detail-favorite"]').text()).toContain('해제')
  })
})
