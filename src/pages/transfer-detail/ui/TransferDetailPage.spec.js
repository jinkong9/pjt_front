import { describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { createRouter, createWebHistory } from 'vue-router'

import { useMemberStore } from '@/entities/member/model/member'
import {
  createTransferComment,
  deleteTransferComment,
  fetchTransferComments,
  fetchTransferDetail,
  toggleFavoriteTransfer,
  updateTransferComment,
} from '@/entities/transfer/api/transferApi'
import TransferDetailPage from './TransferDetailPage.vue'

vi.mock('@/entities/transfer/api/transferApi', () => ({
  createTransferComment: vi.fn(),
  deleteTransfer: vi.fn(),
  deleteTransferComment: vi.fn(),
  fetchTransferComments: vi.fn(),
  fetchTransferDetail: vi.fn(),
  toggleFavoriteTransfer: vi.fn(),
  updateTransferComment: vi.fn(),
}))

function transfer(overrides = {}) {
  return {
    transferId: 1,
    title: '서울 관악구 원룸 양도합니다.',
    content: 'A급 입지입니다.',
    address: '서울 관악구',
    detailAddress: '봉천동 119-12 101호',
    status: '양도가능',
    imageUrls: ['/uploads/room.jpg'],
    depositAmount: 2000,
    monthlyRentAmount: 50,
    maintenanceFee: 5,
    transferFee: 0,
    moveInDate: '2026-06-24',
    contractEndDate: '2026-12-14',
    exclusiveArea: '23.4',
    floor: '1층',
    contactPhone: '010-8791-1753',
    ...overrides,
  }
}

async function mountDetail({ pinia = createPinia() } = {}) {
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
      plugins: [router, pinia],
    },
  })
  await flushPromises()

  return wrapper
}

describe('TransferDetailPage layout', () => {
  it('keeps the hero image in a landscape frame above the detail panels', async () => {
    fetchTransferDetail.mockResolvedValue(transfer())
    fetchTransferComments.mockResolvedValue([])

    const wrapper = await mountDetail()

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
    fetchTransferDetail.mockResolvedValue(transfer())
    fetchTransferComments.mockResolvedValue([])
    toggleFavoriteTransfer.mockResolvedValue({ favorite: true })

    const wrapper = await mountDetail()

    await wrapper.get('[data-testid="transfer-detail-favorite"]').trigger('click')
    await flushPromises()

    expect(toggleFavoriteTransfer).toHaveBeenCalledWith('1')
    expect(wrapper.get('[data-testid="transfer-detail-favorite"]').text()).toContain('관심중')
  })

  it('loads comments and lets the current member create, edit, and delete their comment', async () => {
    fetchTransferDetail.mockResolvedValue(transfer({ imageUrls: [] }))
    fetchTransferComments
      .mockResolvedValueOnce([{ commentId: 3, transferId: 1, writerId: 'ssafy', content: '기존 댓글' }])
      .mockResolvedValueOnce([{ commentId: 4, transferId: 1, writerId: 'ssafy', content: '새 댓글' }])
      .mockResolvedValueOnce([{ commentId: 4, transferId: 1, writerId: 'ssafy', content: '수정 댓글' }])
      .mockResolvedValueOnce([])
    createTransferComment.mockResolvedValue({ commentId: 4, transferId: 1, writerId: 'ssafy', content: '새 댓글' })
    updateTransferComment.mockResolvedValue({ commentId: 4, transferId: 1, writerId: 'ssafy', content: '수정 댓글' })
    deleteTransferComment.mockResolvedValue()
    const pinia = createPinia()

    const wrapper = await mountDetail({ pinia })
    useMemberStore(pinia).current = { userId: 'ssafy', name: '싸피' }
    await flushPromises()

    expect(fetchTransferComments).toHaveBeenCalledWith('1')
    expect(wrapper.text()).toContain('기존 댓글')

    await wrapper.get('[data-testid="transfer-comment-input"]').setValue('새 댓글')
    await wrapper.get('[data-testid="transfer-comment-submit"]').trigger('submit')
    await flushPromises()

    expect(createTransferComment).toHaveBeenCalledWith('1', '새 댓글')
    expect(wrapper.text()).toContain('새 댓글')

    await wrapper.get('[data-testid="transfer-comment-edit-4"]').trigger('click')
    await wrapper.get('[data-testid="transfer-comment-edit-input-4"]').setValue('수정 댓글')
    await wrapper.get('[data-testid="transfer-comment-save-4"]').trigger('submit')
    await flushPromises()

    expect(updateTransferComment).toHaveBeenCalledWith(4, '수정 댓글')
    expect(wrapper.text()).toContain('수정 댓글')

    await wrapper.get('[data-testid="transfer-comment-delete-4"]').trigger('click')
    await flushPromises()

    expect(deleteTransferComment).toHaveBeenCalledWith(4)
  })
})
