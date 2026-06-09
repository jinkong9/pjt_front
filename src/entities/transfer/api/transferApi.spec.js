import { describe, expect, it } from 'vitest'

import {
  createTransferPayload,
  createTransfer,
  deleteTransfer,
  fetchTransferDetail,
  fetchTransfers,
  updateTransfer,
} from '@/entities/transfer/api/transferApi'

describe('transferApi', () => {
  it('builds multipart transfer payload with images', () => {
    const image = new File(['image'], 'room.jpg', { type: 'image/jpeg' })
    const payload = createTransferPayload(
      {
        title: '테스트 양도글',
        depositAmount: '1000',
        imageUrls: ['https://example.com/old.jpg'],
      },
      [image],
    )

    expect(payload).toBeInstanceOf(FormData)
    expect(payload.get('title')).toBe('테스트 양도글')
    expect(payload.get('depositAmount')).toBe('1000')
    expect(payload.getAll('images')).toEqual([image])
    expect(payload.getAll('imageUrls')).toEqual(['https://example.com/old.jpg'])
  })

  it('supports create, update, and delete fallback flow', async () => {
    const created = await createTransfer({
      title: '새 양도글',
      content: '테스트용 양도글입니다.',
      address: '서울 강남구',
      detailAddress: '테스트 원룸',
      depositAmount: 1000,
      monthlyRentAmount: 70,
      maintenanceFee: 8,
      transferFee: 0,
      contractEndDate: '2027-01-01',
      moveInDate: '2026-07-01',
      contactPhone: '010-1234-5678',
      status: '양도가능',
    })

    expect(created.transferId).toBeTruthy()
    expect(created.title).toBe('새 양도글')

    const updated = await updateTransfer(created.transferId, { ...created, title: '수정된 양도글' })
    expect(updated.title).toBe('수정된 양도글')

    const detail = await fetchTransferDetail(created.transferId)
    expect(detail.title).toBe('수정된 양도글')

    await deleteTransfer(created.transferId)
    const transfers = await fetchTransfers()
    expect(transfers.some((post) => post.transferId === created.transferId)).toBe(false)
  })
})
