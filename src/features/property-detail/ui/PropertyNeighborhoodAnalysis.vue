<script setup>
import { computed, ref, watch } from 'vue'
import { getPropertyAnalysis } from '@/entities/analysis/api/analysisApi'
import {
  facilityCounts as countFacilities,
  facilityFilters,
  filterFacilities,
} from '@/entities/analysis/model/facilityCategories'

const props = defineProps({
  trade: { type: Object, required: true },
})

const analysis = ref(null)
const loading = ref(false)
const error = ref('')
const missingCoordinates = ref(false)
const selectedFacilityFilter = ref('all')
let requestToken = 0

const places = computed(() => analysis.value?.places ?? [])
const counts = computed(() => countFacilities(places.value))
const filteredPlaces = computed(() => filterFacilities(places.value, selectedFacilityFilter.value))
const scoreTotal = computed(() => Math.round(Number(analysis.value?.score?.total ?? 0)))
const scoreLevel = computed(() => analysis.value?.score?.level ?? '분석 완료')
const transitSummary = computed(() => analysis.value?.transitSummary ?? {})
const busStopCount = computed(() => Number(transitSummary.value.busStopWithin500m ?? analysis.value?.busStops?.length ?? 0))
const subwayCount = computed(() => Number(transitSummary.value.subwayWithin1km ?? analysis.value?.subwayStations?.length ?? 0))
const trafficRiskSummary = computed(() => analysis.value?.trafficRiskSummary ?? {})
const trafficIssueCount = computed(
  () => Number(trafficRiskSummary.value.eventCount ?? 0) + Number(trafficRiskSummary.value.roadWorkCount ?? 0),
)

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
    if (token === requestToken) analysis.value = result
  } catch {
    if (token === requestToken) error.value = '생활권 분석을 불러오지 못했습니다.'
  } finally {
    if (token === requestToken) loading.value = false
  }
}

watch(() => props.trade.no, loadAnalysis, { immediate: true })
</script>

<template>
  <section class="border border-neutral-200 bg-white p-4" aria-label="가까운 생활시설">
    <div class="flex items-center justify-between gap-3">
      <h3 class="text-xl font-black">가까운 생활시설</h3>
      <span class="text-sm font-black text-neutral-500">{{ counts.all ?? 0 }}곳</span>
    </div>

    <p v-if="loading" class="mt-4 text-sm font-bold text-neutral-500">
      생활시설을 불러오는 중입니다.
    </p>

    <div v-else-if="error" class="mt-4 border border-red-200 bg-red-50 p-4">
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
      class="mt-4 border border-neutral-200 bg-[#f7f4ef] p-4 text-sm font-bold text-neutral-600"
    >
      좌표가 없어 생활권을 분석할 수 없습니다.
    </p>

    <template v-else-if="analysis">
      <div class="mt-5 grid gap-2 sm:grid-cols-3">
        <article class="border border-neutral-200 bg-[#f7f4ef] p-3">
          <span class="block text-[11px] font-black uppercase tracking-[0.14em] text-[#b4212a]">Score</span>
          <strong class="mt-1 block text-2xl font-black">{{ scoreTotal }}점</strong>
          <span class="text-xs font-black text-neutral-500">{{ scoreLevel }}</span>
        </article>
        <article class="border border-neutral-200 bg-white p-3">
          <span class="block text-[11px] font-black uppercase tracking-[0.14em] text-[#b4212a]">Transit</span>
          <p class="mt-1 text-sm font-black">
            버스 {{ busStopCount }}곳 · 지하철 {{ subwayCount }}곳
          </p>
        </article>
        <article class="border border-neutral-200 bg-white p-3">
          <span class="block text-[11px] font-black uppercase tracking-[0.14em] text-[#b4212a]">Traffic</span>
          <p class="mt-1 text-sm font-black">교통 위험 {{ trafficIssueCount }}건</p>
        </article>
      </div>

      <div class="mt-5 flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="filter in facilityFilters"
          :key="filter.key"
          :data-testid="`facility-filter-${filter.key}`"
          type="button"
          class="min-h-11 flex-[0_0_auto] border border-neutral-200 bg-white px-4 text-sm font-black text-neutral-600"
          :class="{
            'border-[#b4212a] bg-white text-[#b4212a]': selectedFacilityFilter === filter.key,
          }"
          @click="selectedFacilityFilter = filter.key"
        >
          {{ filter.label }} {{ counts[filter.key] ?? 0 }}
        </button>
      </div>

      <ul class="mt-5 grid">
        <li
          v-for="place in filteredPlaces"
          :key="`${place.name}-${place.address}`"
          class="border-b border-neutral-100 py-4 first:pt-0 last:border-0"
        >
          <strong class="block text-base font-black">{{ place.name }}</strong>
          <p class="mt-2 text-sm font-black text-neutral-500">
            {{ place.largeCategory }} · {{ place.middleCategory }}
          </p>
          <p class="mt-1 text-sm font-bold text-neutral-500">{{ place.address }}</p>
        </li>
      </ul>

      <p v-if="!filteredPlaces.length" class="mt-4 text-sm font-bold text-neutral-500">
        선택한 카테고리의 시설이 없습니다.
      </p>
    </template>
  </section>
</template>
