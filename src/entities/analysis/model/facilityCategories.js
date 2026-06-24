export const facilityFilters = [
  { key: 'all', label: '전체' },
  { key: 'food', label: '음식' },
  { key: 'cafe', label: '카페' },
  { key: 'medical', label: '의료' },
  { key: 'convenience', label: '편의' },
  { key: 'life', label: '생활' },
]

export function facilityCategory(place = {}) {
  const text = `${place.largeCategory ?? ''} ${place.middleCategory ?? ''} ${place.name ?? ''}`.toLowerCase()
  if (containsAny(text, ['카페', '커피', 'ce7'])) return 'cafe'
  if (containsAny(text, ['음식', '식당', '한식', '중식', '일식', '분식', 'fd6'])) return 'food'
  if (containsAny(text, ['의료', '병원', '의원', '약국', 'hp8', 'pm9'])) return 'medical'
  if (containsAny(text, ['편의', '편의점', '마트', '슈퍼', 'cs2', 'mt1'])) return 'convenience'
  return 'life'
}

export function facilityCounts(places = []) {
  const counts = Object.fromEntries(facilityFilters.map((filter) => [filter.key, 0]))
  counts.all = places.length
  for (const place of places) {
    counts[facilityCategory(place)] += 1
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
