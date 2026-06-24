<script setup>
import { computed, reactive, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useRoute } from 'vue-router'
import { appQueryOptions } from '@/shared/query/appQueries'
import {
  facilityCounts as countFacilities,
  facilityFilters,
  filterFacilities,
} from '@/entities/analysis/model/facilityCategories'

const route = useRoute()
const loading = ref(false)
const analysis = ref(null)
const selectedFacilityFilter = ref('all')

const form = reactive({
  label: queryString('label', '서울특별시 강남구 역삼동'),
  longitude: queryNumber('longitude', 127.0365),
  latitude: queryNumber('latitude', 37.5006),
  radius: queryNumber('radius', 1000),
})
const submittedForm = ref({ ...form })
const analysisQuery = useQuery(computed(() => appQueryOptions.analysis(submittedForm.value)))

const presets = [
  { label: '강남역 근처', place: '서울특별시 강남구 역삼동', latitude: 37.5006, longitude: 127.0365 },
  { label: '봉천동 주거지', place: '서울특별시 관악구 봉천동', latitude: 37.4707, longitude: 126.9368 },
  { label: '광교 중심', place: '경기도 수원시 영통구', latitude: 37.2595, longitude: 127.0475 },
]

const radiusOptions = [
  { label: '500m', value: 500 },
  { label: '1km', value: 1000 },
  { label: '1.5km', value: 1500 },
]

const places = computed(() => analysis.value?.places ?? [])
const counts = computed(() => countFacilities(places.value))
const filteredPlaces = computed(() => filterFacilities(places.value, selectedFacilityFilter.value))
const scoreTotal = computed(() => Math.round(Number(analysis.value?.score?.total ?? 0)))
const scoreLevel = computed(() => analysis.value?.score?.level ?? '분석 완료')
const transitSummary = computed(() => analysis.value?.transitSummary ?? {})
const busStopCount = computed(() => Number(transitSummary.value.busStopWithin500m ?? analysis.value?.busStops?.length ?? 0))
const subwayCount = computed(() => Number(transitSummary.value.subwayWithin1km ?? analysis.value?.subwayStations?.length ?? 0))
const trafficRiskSummary = computed(() => analysis.value?.trafficRiskSummary ?? {})
const trafficRiskLabel = computed(() => trafficRiskSummary.value.riskLevel ?? 'Low')
const trafficIssueCount = computed(
  () => Number(trafficRiskSummary.value.eventCount ?? 0) + Number(trafficRiskSummary.value.roadWorkCount ?? 0),
)

function queryString(key, fallback) {
  const value = route.query?.[key]
  if (Array.isArray(value)) return value[0] || fallback
  return value || fallback
}

function queryNumber(key, fallback) {
  const number = Number(queryString(key, fallback))
  return Number.isFinite(number) ? number : fallback
}

function applyPreset(preset) {
  form.label = preset.place
  form.latitude = preset.latitude
  form.longitude = preset.longitude
}

function createFallbackAnalysis() {
  return {
    radiusMeters: form.radius,
    score: {
      total: 82,
      level: 'Good',
    },
    trafficRiskSummary: {
      eventCount: 0,
      roadWorkCount: 0,
      riskLevel: 'Low',
    },
    transitSummary: {
      busStopWithin500m: 2,
      subwayWithin1km: 1,
    },
    places: [
      {
        name: '렌즈커뮤니케이션즈',
        largeCategory: '시설관리·임대',
        middleCategory: '산업용품 대여',
        address: '서울특별시 강남구 논현로 651',
      },
      {
        name: '케이컴',
        largeCategory: '과학·기술',
        middleCategory: '광고',
        address: '서울특별시 강남구 논현로 641',
      },
      {
        name: '티랩',
        largeCategory: '교육',
        middleCategory: '기타 교육',
        address: '서울특별시 강남구 논현로124길 21',
      },
      {
        name: '티원주',
        largeCategory: '과학·기술',
        middleCategory: '광고',
        address: '서울특별시 강남구 논현로126길 24',
      },
      {
        name: '에스크로스컨설팅',
        largeCategory: '과학·기술',
        middleCategory: '광고',
        address: '서울특별시 강남구 학동로 333',
      },
    ],
  }
}

async function analyze() {
  selectedFacilityFilter.value = 'all'
  submittedForm.value = { ...form }
  loading.value = true
  try {
    const { data } = await analysisQuery.refetch()
    analysis.value = data
  } catch {
    analysis.value = createFallbackAnalysis()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="mx-auto w-[min(1480px,calc(100%_-_48px))] py-28 text-[#171717]">
    <section class="border border-neutral-200 bg-white p-6">
      <p class="m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
        Life Analysis
      </p>
      <h1 class="mt-3 text-[clamp(42px,6vw,76px)] font-black leading-none">생활권 분석</h1>
      <p class="mt-3 text-sm font-bold leading-7 text-neutral-500">
        지도에서 선택한 매물 주변의 대형마트, 편의점, 학교, 어린이집·유치원, 카페, 병원, 음식점을 카카오 주변검색 기준으로 확인합니다.
      </p>

      <form class="mt-6 grid gap-3 lg:grid-cols-[minmax(260px,1fr)_auto_auto]" @submit.prevent="analyze">
        <input
          v-model="form.label"
          class="min-h-12 border border-neutral-200 bg-white px-3 text-sm font-black outline-0"
          placeholder="분석할 위치"
          required
        />
        <div class="grid grid-cols-3 gap-2">
          <button
            v-for="option in radiusOptions"
            :key="option.value"
            type="button"
            :data-testid="`analysis-radius-${option.value}`"
            class="min-h-12 border px-4 text-sm font-black"
            :class="
              form.radius === option.value
                ? 'border-[#b4212a] bg-[#b4212a] text-white'
                : 'border-neutral-200 bg-white text-[#171717]'
            "
            @click="form.radius = option.value"
          >
            {{ option.label }}
          </button>
        </div>
        <button
          type="submit"
          class="min-h-12 border border-[#b4212a] bg-[#b4212a] px-6 font-black text-white"
        >
          {{ loading ? '분석 중' : '분석하기' }}
        </button>
      </form>

      <div class="mt-4 flex flex-wrap gap-2">
        <button
          v-for="preset in presets"
          :key="preset.label"
          type="button"
          class="min-h-9 border border-neutral-200 bg-white px-3 text-xs font-black"
          @click="applyPreset(preset)"
        >
          {{ preset.label }}
        </button>
      </div>
    </section>

    <section v-if="analysis" class="mt-5 border border-neutral-200 bg-white p-8">
      <div class="mb-8 grid gap-3 md:grid-cols-3">
        <article class="border border-neutral-200 bg-[#f7f4ef] p-5">
          <p class="text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]">Score</p>
          <strong class="mt-2 block text-4xl font-black text-[#171717]">{{ scoreTotal }}점</strong>
          <span class="mt-2 block text-sm font-black text-neutral-500">{{ scoreLevel }}</span>
        </article>
        <article class="border border-neutral-200 bg-white p-5">
          <p class="text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]">Transit</p>
          <div class="mt-3 grid grid-cols-2 gap-3">
            <div>
              <span class="block text-sm font-black text-neutral-500">버스</span>
              <strong class="text-3xl font-black">{{ busStopCount }}곳</strong>
            </div>
            <div>
              <span class="block text-sm font-black text-neutral-500">지하철</span>
              <strong class="text-3xl font-black">{{ subwayCount }}곳</strong>
            </div>
          </div>
        </article>
        <article class="border border-neutral-200 bg-white p-5">
          <p class="text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]">Traffic</p>
          <strong class="mt-2 block text-4xl font-black">{{ trafficIssueCount }}건</strong>
          <span class="mt-2 block text-sm font-black text-neutral-500">교통 위험 {{ trafficRiskLabel }}</span>
        </article>
      </div>

      <div class="flex items-start justify-between gap-6">
        <h2 class="text-[clamp(36px,5vw,56px)] font-black leading-none">가까운 생활시설</h2>
        <span class="pt-3 text-lg font-black text-neutral-500">{{ counts.all ?? 0 }}곳</span>
      </div>

      <div class="mt-10 flex gap-2 overflow-x-auto pb-1">
        <button
          v-for="filter in facilityFilters"
          :key="filter.key"
          type="button"
          :data-testid="`analysis-facility-filter-${filter.key}`"
          class="min-h-[50px] flex-[0_0_auto] border border-neutral-200 bg-white px-5 text-base font-black"
          :class="{
            'border-[#b4212a] text-[#b4212a]': selectedFacilityFilter === filter.key,
          }"
          @click="selectedFacilityFilter = filter.key"
        >
          {{ filter.label }} {{ counts[filter.key] ?? 0 }}
        </button>
      </div>

      <ul class="mt-7 grid">
        <li
          v-for="place in filteredPlaces"
          :key="`${place.name}-${place.address}`"
          class="border-b border-neutral-100 py-6 first:pt-0 last:border-0"
        >
          <strong class="block text-2xl font-black">{{ place.name }}</strong>
          <p class="mt-4 text-lg font-black text-neutral-500">
            {{ place.largeCategory }} / {{ place.middleCategory }} · {{ place.address }}
          </p>
        </li>
      </ul>

      <p v-if="!filteredPlaces.length" class="mt-8 text-lg font-black text-neutral-500">
        선택한 카테고리의 시설이 없습니다.
      </p>
    </section>

    <section v-else class="mt-5 border border-neutral-200 bg-white p-8">
      <div class="flex items-start justify-between gap-6">
        <h2 class="text-[clamp(36px,5vw,56px)] font-black leading-none">가까운 생활시설</h2>
        <span class="pt-3 text-lg font-black text-neutral-500">0곳</span>
      </div>
      <p class="mt-8 text-lg font-black text-neutral-500">
        분석하기를 누르면 주변 생활시설 목록이 표시됩니다.
      </p>
    </section>
  </main>
</template>
