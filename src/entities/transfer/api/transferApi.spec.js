import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  createTransfer,
  createTransferPayload,
  deleteTransfer,
  fetchTransfers,
  normalizeTransfer,
  resolveTransferImageUrl,
  updateTransfer,
} from '@/entities/transfer/api/transferApi'
import { api } from '@/shared/api/client'

vi.mock('@/shared/api/client', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  toQuery: (params) =>
    Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
    ),
}))

describe('transferApi', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

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

  it('uses backend transfer data without falling back to sample posts', async () => {
    api.get.mockResolvedValueOnce({
      data: [
        {
          transfer_id: 7,
          writer_id: 3,
          title: '강남구 역삼동 전월세 양도',
          image_urls: ['https://example.com/room.jpg'],
        },
      ],
    })

    await expect(fetchTransfers({ keyword: '강남' })).resolves.toEqual([
      expect.objectContaining({
        transferId: 7,
        writerId: 3,
        title: '강남구 역삼동 전월세 양도',
        imageUrls: ['https://example.com/room.jpg'],
      }),
    ])
    expect(api.get).toHaveBeenCalledWith('/transfers', { params: { keyword: '강남' } })
  })

  it('normalizes transfer image URLs from backend variants', () => {
    expect(resolveTransferImageUrl('/uploads/room.jpg')).toBe('/api/uploads/room.jpg')
    expect(resolveTransferImageUrl('uploads/room.jpg')).toBe('/api/uploads/room.jpg')
    expect(resolveTransferImageUrl('https://cdn.example.com/room.jpg')).toBe(
      'https://cdn.example.com/room.jpg',
    )

    expect(
      normalizeTransfer({
        transfer_id: 11,
        image_url: '/uploads/one.jpg',
        image_urls: 'uploads/two.jpg, https://cdn.example.com/three.jpg',
      }).imageUrls,
    ).toEqual([
      '/api/uploads/one.jpg',
      '/api/uploads/two.jpg',
      'https://cdn.example.com/three.jpg',
    ])
  })

  it('propagates backend errors instead of serving sample transfer data', async () => {
    api.get.mockRejectedValueOnce(new Error('backend unavailable'))

    await expect(fetchTransfers()).rejects.toThrow('backend unavailable')
  })

  it('sends transfer mutations to the backend without local fallback state', async () => {
    api.post.mockResolvedValueOnce({ data: { transfer_id: 10, title: '등록된 양도글' } })
    api.put.mockResolvedValueOnce({ data: { transfer_id: 10, title: '수정된 양도글' } })
    api.delete.mockResolvedValueOnce({})

    await expect(createTransfer({ title: '등록된 양도글' })).resolves.toMatchObject({
      transferId: 10,
      title: '등록된 양도글',
    })
    await expect(updateTransfer(10, { title: '수정된 양도글' })).resolves.toMatchObject({
      transferId: 10,
      title: '수정된 양도글',
    })
    await expect(deleteTransfer(10)).resolves.toBeUndefined()

    expect(api.post).toHaveBeenCalledTimes(1)
    expect(api.put).toHaveBeenCalledTimes(1)
    expect(api.delete).toHaveBeenCalledWith('/transfers/10')
  })
})
