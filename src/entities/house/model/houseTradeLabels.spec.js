import { describe, expect, it } from 'vitest'

import { getHouseTradeLabel, getHouseTradePriceLabel } from './houseTradeLabels'

describe('houseTradeLabels', () => {
  it('formats explicit property and deal types', () => {
    expect(
      getHouseTradeLabel({
        property_type: 'OFFICETEL',
        trade_type: 'JEONSE',
      }),
    ).toBe('오피스텔 / 전세')
  })

  it('formats one-room monthly rent from camelCase fields', () => {
    expect(
      getHouseTradeLabel({
        houseType: 'ONE_ROOM',
        dealType: 'MONTHLY_RENT',
      }),
    ).toBe('원룸 / 월세')
  })

  it('falls back to apartment sale for current house deal responses', () => {
    expect(
      getHouseTradeLabel({
        aptName: '래미안',
        dealAmount: '210000',
      }),
    ).toBe('아파트 / 매매')
  })

  it('formats rent prices from deposit and monthly rent fields', () => {
    expect(
      getHouseTradePriceLabel({
        dealType: 'RENT',
        depositAmount: '3000',
        monthlyRentAmount: '120',
      }),
    ).toBe('3,000만원 / 120만원')
  })

  it('formats jeonse prices when rent monthly amount is zero', () => {
    expect(
      getHouseTradePriceLabel({
        dealType: 'RENT',
        depositAmount: '12000',
        monthlyRentAmount: '0',
      }),
    ).toBe('1.2억')
  })
})
