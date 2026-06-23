import { describe, expect, it } from 'vitest'

import { formatManwonToKoreanMoney } from './formatMoney'

describe('formatManwonToKoreanMoney', () => {
  it('keeps amounts below one eok in manwon', () => {
    expect(formatManwonToKoreanMoney(3000)).toBe('3,000만원')
  })

  it('converts exact and decimal eok amounts', () => {
    expect(formatManwonToKoreanMoney(10000)).toBe('1억')
    expect(formatManwonToKoreanMoney(35000)).toBe('3.5억')
  })
})
