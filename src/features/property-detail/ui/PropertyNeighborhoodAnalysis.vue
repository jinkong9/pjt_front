<script setup>
import { computed, ref, watch } from 'vue'
import { getPropertyAnalysis } from '@/entities/analysis/api/analysisApi'

const props = defineProps({
  trade: { type: Object, required: true },
})

const analysis = ref(null)
const loading = ref(false)
const error = ref('')
const missingCoordinates = ref(false)
const placesExpanded = ref(false)
const eventsExpanded = ref(false)
let requestToken = 0

const places = computed(() => {
  const items = analysis.value?.places ?? []
  return placesExpanded.value ? items : items.slice(0, 5)
})
const events = computed(() => {
  const items = analysis.value?.events ?? analysis.value?.trafficEvents ?? []
  return eventsExpanded.value ? items : items.slice(0, 3)
})
const hasMorePlaces = computed(() => (analysis.value?.places?.length ?? 0) > 5)
const hasMoreEvents = computed(() => {
  const items = analysis.value?.events ?? analysis.value?.trafficEvents ?? []
  return items.length > 3
})

async function loadAnalysis() {
  const token = ++requestToken
  const longitude = Number(props.trade.longitude)
  const latitude = Number(props.trade.latitude)
  loading.value = true
  error.value = ''
  missingCoordinates.value = false
  analysis.value = null
  placesExpanded.value = false
  eventsExpanded.value = false
  if (
    props.trade.longitude === null ||
    props.trade.longitude === undefined ||
    props.trade.longitude === '' ||
    props.trade.latitude === null ||
    props.trade.latitude === undefined ||
    props.trade.latitude === '' ||
    !Number.isFinite(longitude) ||
    !Number.isFinite(latitude)
  ) {
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
        <div
          data-testid="score-grid"
          class="mt-4 grid !grid-cols-2 gap-2"
        >
          <div
            v-for="[label, value] in [
              ['종합 점수', analysis.score.total],
              ['상권 점수', analysis.score.commercialScore],
              ['대중교통 점수', analysis.score.transitScore],
              ['교통안전 점수', analysis.score.trafficSafetyScore],
            ]"
            :key="label"
            class="bg-[#f7f4ef] p-3"
          >
            <p class="text-[11px] font-black text-neutral-500">{{ label }}</p>
            <strong class="mt-1 block text-xl text-[#b4212a]">{{ value }}점</strong>
          </div>
        </div>
        <p class="mt-3 text-xs font-bold leading-5 text-neutral-600">
          {{ analysis.score.message }}
        </p>
      </section>

      <section class="border border-neutral-200 bg-white p-4">
        <h3 class="text-base font-black">상권 요약</h3>
        <dl
          class="mt-3 grid !grid-cols-2 gap-x-4 gap-y-3 text-sm"
        >
          <div
            v-for="[label, value] in [
              ['전체 시설', analysis.commercialSummary.totalCount],
              ['음식', analysis.commercialSummary.foodCount],
              ['카페', analysis.commercialSummary.cafeCount],
              ['의료', analysis.commercialSummary.medicalCount],
              ['편의', analysis.commercialSummary.convenienceCount],
              ['생활', analysis.commercialSummary.lifeCount],
            ]"
            :key="label"
            class="flex items-center justify-between border-b border-neutral-100 pb-2"
          >
            <dt class="text-xs font-bold text-neutral-500">{{ label }}</dt>
            <dd class="font-black">{{ value }}곳</dd>
          </div>
        </dl>
      </section>

      <section class="border border-neutral-200 bg-white p-4">
        <h3 class="text-base font-black">대중교통 요약</h3>
        <dl class="mt-3 space-y-2 text-sm">
          <div
            v-for="[label, value] in [
              ['500m 이내 지하철', analysis.transitSummary.subwayWithin500m],
              ['1km 이내 지하철', analysis.transitSummary.subwayWithin1000m],
              ['300m 이내 버스정류장', analysis.transitSummary.busStopWithin300m],
              ['500m 이내 버스정류장', analysis.transitSummary.busStopWithin500m],
              ['1km 이내 버스정류장', analysis.transitSummary.busStopWithin1000m],
            ]"
            :key="label"
            class="flex justify-between"
          >
            <dt class="text-xs font-bold text-neutral-500">{{ label }}</dt>
            <dd class="font-black">{{ value }}곳</dd>
          </div>
        </dl>
      </section>

      <section class="border border-neutral-200 bg-white p-4">
        <h3 class="text-base font-black">교통 위험 요약</h3>
        <dl class="mt-3 grid !grid-cols-3 gap-2 text-center">
          <div
            v-for="[label, value] in [
              ['교통 이벤트', analysis.trafficRiskSummary.eventCount],
              ['도로공사', analysis.trafficRiskSummary.roadworkCount],
              ['위험 등급', analysis.trafficRiskSummary.riskLevel],
            ]"
            :key="label"
            class="bg-[#f7f4ef] p-3"
          >
            <dt class="text-[11px] font-black text-neutral-500">{{ label }}</dt>
            <dd class="mt-1 text-sm font-black">{{ value }}</dd>
          </div>
        </dl>
      </section>

      <section class="border border-neutral-200 bg-white p-4">
        <h3 class="text-base font-black">가까운 생활 시설</h3>
        <ul class="mt-3 space-y-3">
          <li
            v-for="place in places"
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
        <button
          v-if="hasMorePlaces && !placesExpanded"
          data-testid="expand-places"
          class="mt-4 w-full border border-neutral-300 bg-white px-3 py-2 text-xs font-black text-[#b4212a]"
          @click="placesExpanded = true"
        >
          더보기
        </button>
      </section>

      <section class="border border-neutral-200 bg-white p-4">
        <h3 class="text-base font-black">교통 체크 포인트</h3>
        <ul class="mt-3 space-y-3">
          <li
            v-for="event in events"
            :key="`${event.type}-${event.roadName}-${event.message}`"
            class="border-t border-neutral-100 pt-3 first:border-0 first:pt-0"
          >
            <strong class="text-sm">{{ event.type }} · {{ event.roadName }}</strong>
            <p class="mt-1 text-xs leading-5 text-neutral-500">{{ event.message }}</p>
          </li>
        </ul>
        <button
          v-if="hasMoreEvents && !eventsExpanded"
          data-testid="expand-events"
          class="mt-4 w-full border border-neutral-300 bg-white px-3 py-2 text-xs font-black text-[#b4212a]"
          @click="eventsExpanded = true"
        >
          더보기
        </button>
      </section>
    </template>
  </section>
</template>
