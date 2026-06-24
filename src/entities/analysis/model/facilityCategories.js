export const facilityFilters = [
  { key: 'all', label: '전체' },
  { key: 'mart', label: '대형마트' },
  { key: 'convenience', label: '편의점' },
  { key: 'school', label: '학교' },
  { key: 'daycare', label: '어린이집·유치원' },
  { key: 'cafe', label: '카페' },
  { key: 'hospital', label: '병원' },
  { key: 'restaurant', label: '음식점' },
]

export function facilityCategory(place = {}) {
  const text = `${place.largeCategory ?? ''} ${place.middleCategory ?? ''} ${place.name ?? ''}`.toLowerCase()

  if (containsAny(text, ['대형마트', '할인점', 'hypermarket', 'supermarket', 'mart', 'mt1'])) {
    return 'mart'
  }
  if (containsAny(text, ['편의점', 'convenience', 'cs2'])) {
    return 'convenience'
  }
  if (containsAny(text, ['어린이집', '유치원', '보육', 'daycare', 'kindergarten', 'preschool', 'ps3'])) {
    return 'daycare'
  }
  if (containsAny(text, ['학교', '초등학교', '중학교', '고등학교', '대학교', 'school', 'university', 'sc4'])) {
    return 'school'
  }
  if (containsAny(text, ['카페', '커피', 'cafe', 'coffee', 'ce7'])) {
    return 'cafe'
  }
  if (containsAny(text, ['병원', '의원', '의료', 'clinic', 'hospital', 'hp8'])) {
    return 'hospital'
  }
  if (containsAny(text, ['음식점', '음식', '식당', '한식', '중식', '일식', '분식', 'food', 'restaurant', 'fd6'])) {
    return 'restaurant'
  }
  return 'other'
}

export function facilityCounts(places = []) {
  const counts = Object.fromEntries(facilityFilters.map((filter) => [filter.key, 0]))
  counts.all = places.length
  for (const place of places) {
    const category = facilityCategory(place)
    if (Object.prototype.hasOwnProperty.call(counts, category)) {
      counts[category] += 1
    }
  }
  return counts
}

export function filterFacilities(places = [], filterKey = 'all') {
  if (filterKey === 'all') return places
  return places.filter((place) => facilityCategory(place) === filterKey)
}

function containsAny(value, keywords) {
  return keywords.some((keyword) => value.includes(keyword))
}
