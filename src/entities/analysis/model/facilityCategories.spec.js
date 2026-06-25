import { describe, expect, it } from 'vitest'

import { facilityCategory, facilityCounts, filterFacilities } from './facilityCategories'

describe('facilityCategories', () => {
  it('classifies convenience store brands returned as 편의 category rows', () => {
    const places = [
      {
        name: 'CU 논현경복점',
        largeCategory: '편의',
        middleCategory: 'CU',
        address: '서울 강남구 봉은사로43길 14',
      },
      {
        name: '세븐일레븐 논현점',
        largeCategory: '생활편의',
        middleCategory: '세븐일레븐',
        address: '서울 강남구 논현로',
      },
    ]

    expect(facilityCategory(places[0])).toBe('convenience')
    expect(facilityCounts(places).convenience).toBe(2)
    expect(filterFacilities(places, 'convenience')).toEqual(places)
  })
})
