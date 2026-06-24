<script setup>
import { computed, ref, watch } from 'vue'
import { getPropertyAnalysis } from '@/entities/analysis/api/analysisApi'

const props = defineProps({
  trade: { type: Object, required: true },
})

const facilityFilters = [
  { key: 'all', label: '전체' },
  { key: 'food', label: '음식' },
  { key: 'cafe', label: '카페' },
  { key: 'medical', label: '의료' },
  { key: 'convenience', label: '편의' },
  { key: 'life', label: '생활' },
]

const analysis = ref(null)
const busStops = ref([])
const subwayStations = ref([])
const loading = ref(false)
const error = ref('')
const missingCoordinates = ref(false)
const selectedFacilityFilter = ref('all')
let requestToken = 0

const facilityCounts = computed(() => {
  const counts = Object.fromEntries(facilityFilters.map((filter) => [filter.key, 0]))
  const items = analysis.value?.places ?? []
  counts.all = items.length
  for (const place of items) {
    counts[facilityCategory(place)] += 1
  }
  return counts
})

const filteredPlaces = computed(() => {
  const items = analysis.value?.places ?? []
  if (selectedFacilityFilter.value === 'all') {
    return items
  }
  return items.filter((place) => facilityCategory(place) === selectedFacilityFilter.value)
})

const transitSummaryItems = computed(() => [
  ['500m 이내 지하철', analysis.value?.transitSummary?.subwayWithin500m ?? 0],
  ['1km 이내 지하철', analysis.value?.transitSummary?.subwayWithin1000m ?? 0],
  ['300m 이내 버스정류장', analysis.value?.transitSummary?.busStopWithin300m ?? 0],
  ['500m 이내 버스정류장', analysis.value?.transitSummary?.busStopWithin500m ?? 0],
  ['1km 이내 버스정류장', analysis.value?.transitSummary?.busStopWithin1000m ?? 0],
])

const trafficIssueCount = computed(
  () =>
    (analysis.value?.trafficRiskSummary?.eventCount ?? 0) +
    (analysis.value?.trafficRiskSummary?.roadworkCount ?? 0),
)

const scoreCards = computed(() => [
  { label: '종합 점수', value: analysis.value?.score?.total ?? 0, unit: '점' },
  { label: '상권 점수', value: analysis.value?.score?.commercialScore ?? 0, unit: '점' },
  { label: '대중교통 점수', value: analysis.value?.score?.transitScore ?? 0, unit: '점' },
  { label: '교통 이슈 건수', value: trafficIssueCount.value, unit: '건' },
])

function facilityCategory(place) {
  const text = `${place.largeCategory ?? ''} ${place.middleCategory ?? ''}`
  if (text.includes('카페') || text.includes('커피')) return 'cafe'
  if (text.includes('음식') || text.includes('식당') || text.includes('한식')) return 'food'
  if (text.includes('의료') || text.includes('병원') || text.includes('의원') || text.includes('약국')) {
    return 'medical'
  }
  if (text.includes('편의') || text.includes('편의점')) return 'convenience'
  return 'life'
}

function hasCoordinates(longitude, latitude) {
  return (
    props.trade.longitude !== null &&
    props.trade.longitude !== undefined &&
    props.trade.longitude !== '' &&
    props.trade.latitude !== null &&
    props.trade.latitude !== undefined &&
    props.trade.latitude !== '' &&
    Number.isFinite(longitude) &&
    Number.isFinite(latitude)
  )
}

async function loadAnalysis() {
  const token = ++requestToken
  const longitude = Number(props.trade.longitude)
  const latitude = Number(props.trade.latitude)
  loading.value = true
  error.value = ''
  missingCoordinates.value = false
  analysis.value = null
  busStops.value = []
  subwayStations.value = []
  selectedFacilityFilter.value = 'all'

  if (!hasCoordinates(longitude, latitude)) {
    missingCoordinates.value = true
    loading.value = false
    return
  }

  try {
    const result = await getPropertyAnalysis({
      label: props.trade.address,
      longitude,
      latitude,
      radius: 1000,
    })
    if (token === requestToken) {
      analysis.value = result
      busStops.value = result.busStops ?? []
      subwayStations.value = result.subwayStations ?? []
    }
  } catch {
    if (token === requestToken) error.value = '생활권 분석을 불러오지 못했습니다.'
  } finally {
    if (token === requestToken) loading.value = false
  }
}

watch(() => props.trade.no, loadAnalysis, { immediate: true })
</script>

<template>
  <section class="space-y-5" aria-label="생활권 분석">
    <p v-if="loading" class="text-sm font-bold text-neutral-500">
      생활권 분석을 불러오는 중입니다.
    </p>
    <div v-else-if="error" class="border border-red-200 bg-red-50 p-4">
      <p class="text-sm font-bold text-red-700">{{ error }}</p>
      <button
        data-testid="retry-analysis"
        class="mt-3 border border-red-300 bg-white px-3 py-2 text-xs font-black text-red-700"
        @click="loadAnalysis"
      >
        다시 시도
      </button>
    </div>
    <p
      v-else-if="missingCoordinates"
      class="border border-neutral-200 bg-[#f7f4ef] p-4 text-sm font-bold text-neutral-600"
    >
      좌표가 없어 생활권을 분석할 수 없습니다.
    </p>

    <template v-else-if="analysis">
      <section class="border border-neutral-200 bg-white p-4">
        <div class="flex items-end justify-between gap-3">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.16em] text-[#b4212a]">
              Neighborhood
            </p>
            <h3 class="mt-1 text-lg font-black">생활권 종합 평가</h3>
          </div>
          <span class="bg-[#fff1f2] px-3 py-1 text-xs font-black text-[#b4212a]">{{
            analysis.score.level
          }}</span>
        </div>
        <div data-testid="score-grid" class="mt-4 grid grid-cols-1 gap-2 sm:!grid-cols-2">
          <div
            v-for="card in scoreCards"
            :key="card.label"
            class="bg-[#f7f4ef] p-3"
          >
            <p class="text-[11px] font-black text-neutral-500">{{ card.label }}</p>
            <strong class="mt-1 block text-xl text-[#b4212a]">{{ card.value }}{{ card.unit }}</strong>
          </div>
        </div>
        <p class="mt-3 text-xs font-bold leading-5 text-neutral-600">
          {{ analysis.score.message }}
        </p>
      </section>

      <section class="border border-neutral-200 bg-white p-4">
        <h3 class="text-base font-black">대중교통 요약</h3>
        <dl class="mt-3 grid grid-cols-1 gap-2 text-sm sm:!grid-cols-2">
          <div
            v-for="[label, value] in transitSummaryItems"
            :key="label"
            class="flex flex-wrap items-center justify-between gap-2 bg-[#f7f4ef] px-3 py-2"
          >
            <dt class="text-[11px] font-bold text-neutral-500">{{ label }}</dt>
            <dd class="font-black">{{ value }}곳</dd>
          </div>
        </dl>

        <div class="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-black">근처 버스정류장</h4>
              <span class="text-xs font-black text-[#b4212a]">{{ busStops.length }}곳</span>
            </div>
            <ul class="mt-2 space-y-2">
              <li
                v-for="stop in busStops"
                :key="stop.nodeId"
                class="border border-neutral-100 bg-white px-3 py-2"
              >
                <strong class="block text-sm">{{ stop.nodeName }}</strong>
                <span class="mt-1 block text-xs font-bold text-neutral-500">
                  정류장 번호 {{ stop.nodeNo || '-' }}
                </span>
              </li>
            </ul>
            <p v-if="!busStops.length" class="mt-2 text-xs font-bold text-neutral-500">
              500m 이내 정류장 정보가 없습니다.
            </p>
          </div>

          <div>
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-black">근처 지하철역</h4>
              <span class="text-xs font-black text-[#b4212a]">{{ subwayStations.length }}곳</span>
            </div>
            <ul class="mt-2 space-y-2">
              <li
                v-for="station in subwayStations"
                :key="station.id"
                class="border border-neutral-100 bg-white px-3 py-2"
              >
                <strong class="block text-sm">{{ station.name }}</strong>
                <span class="mt-1 block text-xs font-bold text-neutral-500">
                  {{ station.distanceMeters }}m · {{ station.address || '주소 정보 없음' }}
                </span>
              </li>
            </ul>
            <p v-if="!subwayStations.length" class="mt-2 text-xs font-bold text-neutral-500">
              1km 이내 지하철역 정보가 없습니다.
            </p>
          </div>
        </div>
      </section>

      <section class="border border-neutral-200 bg-white p-4">
        <div class="flex items-center justify-between gap-3">
          <h3 class="text-base font-black">가까운 생활시설</h3>
          <span class="text-xs font-black text-neutral-500">
            {{ filteredPlaces.length }}곳
          </span>
        </div>

        <div class="mt-3 flex gap-2 overflow-x-auto pb-1">
          <button
            v-for="filter in facilityFilters"
            :key="filter.key"
            :data-testid="`facility-filter-${filter.key}`"
            type="button"
            class="min-h-9 flex-[0_0_auto] border border-neutral-200 bg-white px-3 text-xs font-black text-neutral-600"
            :class="{
              'border-[#b4212a] bg-[#fff1f2] text-[#b4212a]': selectedFacilityFilter === filter.key,
            }"
            @click="selectedFacilityFilter = filter.key"
          >
            {{ filter.label }} {{ facilityCounts[filter.key] ?? 0 }}
          </button>
        </div>

        <ul class="mt-3 space-y-3">
          <li
            v-for="place in filteredPlaces"
            :key="`${place.name}-${place.address}`"
            class="border-t border-neutral-100 pt-3 first:border-0 first:pt-0"
          >
            <strong class="text-sm">{{ place.name }}</strong>
            <p class="mt-1 text-xs font-bold text-neutral-500">
              {{ place.largeCategory }} · {{ place.middleCategory }}
            </p>
            <p class="mt-1 text-xs text-neutral-500">{{ place.address }}</p>
          </li>
        </ul>
        <p v-if="!filteredPlaces.length" class="mt-3 text-xs font-bold text-neutral-500">
          선택한 카테고리의 시설이 없습니다.
        </p>
      </section>
    </template>
  </section>
</template>
