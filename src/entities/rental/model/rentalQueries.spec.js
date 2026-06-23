import { describe, expect, it } from 'vitest'
import { rentalKeys } from './rentalQueries'

describe('rental query keys', () => {
  it('builds stable list keys from plain params', () => {
    expect(rentalKeys.list({ keyword: '서울', page: 1, size: 12 })).toEqual([
      'rentals',
      'list',
      { keyword: '서울', page: 1, size: 12 },
    ])
  })

  it('builds separate keys for detail favorites and recommendations', () => {
    expect(rentalKeys.detail('A123')).toEqual(['rentals', 'detail', 'A123'])
    expect(rentalKeys.favorites()).toEqual(['rentals', 'favorites'])
    expect(rentalKeys.recommendations(10)).toEqual(['rentals', 'recommendations', 10])
  })
})
