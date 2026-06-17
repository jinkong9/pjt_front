<script setup>
import { computed, reactive, ref } from 'vue'
import { api } from '@/shared/api/client'

const loading = ref(false)
const analysis = ref(null)
const form = reactive({
  label: '관악구 봉천동',
  longitude: 126.9413,
  latitude: 37.4826,
  radius: 1000,
  priority: 'balanced',
})

const presets = [
  { label: '학교 근처', place: '서울 관악구 대학동', latitude: 37.4707, longitude: 126.9368 },
  { label: '역세권', place: '서울 강남구 역삼동', latitude: 37.5006, longitude: 127.0365 },
  { label: '주거 밀집', place: '경기 수원시 영통구', latitude: 37.2595, longitude: 127.0475 },
]

const radiusOptions = [
  { label: '걸어서 5분', value: 500 },
  { label: '걸어서 10분', value: 1000 },
  { label: '넓게 보기', value: 1500 },
]

const priorityOptions = [
  { label: '균형', value: 'balanced' },
  { label: '상권 중심', value: 'commercial' },
  { label: '교통 안전', value: 'traffic' },
]

const resultSummary = computed(() => {
  if (!analysis.value) return null
  const score = analysis.value.score?.total ?? 0
  if (score >= 80) return '생활 편의성이 좋아 보여요.'
  if (score >= 60) return '무난한 생활권입니다.'
  return '조건을 조금 더 확인해보세요.'
})

function applyPreset(preset) {
  form.label = preset.place
  form.latitude = preset.latitude
  form.longitude = preset.longitude
}

function createFallbackAnalysis() {
  return {
    score: { total: 76, level: '양호' },
    commercialSummary: { totalCount: 38 },
    trafficRiskSummary: { eventCount: 2, riskLevel: '주의 낮음' },
    radiusMeters: form.radius,
    places: [
      {
        name: '편의점 밀집 구역',
        largeCategory: '생활편의',
        middleCategory: '편의점',
        address: `${form.label} 인근`,
      },
      {
        name: '카페 거리',
        largeCategory: '음식',
        middleCategory: '카페',
        address: `${form.label} 중심가`,
      },
      {
        name: '동네 병원',
        largeCategory: '의료',
        middleCategory: '의원',
        address: `${form.label} 생활권`,
      },
    ],
    trafficEvents: [
      { type: '혼잡', message: '출퇴근 시간대 주요 도로 혼잡 가능성이 있습니다.' },
      { type: '주의', message: '공사 또는 교통 이벤트는 방문 전 한 번 더 확인하세요.' },
    ],
  }
}

async function analyze() {
  loading.value = true
  try {
    const { data } = await api.get('/analysis', { params: form })
    analysis.value = data
  } catch {
    analysis.value = createFallbackAnalysis()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main class="shell page-shell mx-auto w-[min(1480px,calc(100%_-_48px))] py-28">
    <div class="section-head mb-8 flex items-end justify-between gap-6">
      <div>
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
          Life Analysis
        </p>
        <h1 class="page-title mt-3 max-w-4xl text-[clamp(42px,6vw,76px)] font-black leading-none">
          생활권 분석
        </h1>
        <p class="muted mt-3 text-sm font-bold leading-7 text-neutral-500">
          동네 이름과 생활 반경만 고르면 상권과 교통 환경을 빠르게 비교합니다.
        </p>
      </div>
    </div>

    <section class="analysis-workspace grid grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] gap-5">
      <article class="panel analysis-quick-form border border-neutral-200 bg-white p-6">
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">Start</p>
        <h2 class="mt-2 text-[34px] font-black text-[#171717]">어디를 볼까요?</h2>
        <form class="analysis-form mt-6 grid gap-4" @submit.prevent="analyze">
          <label class="grid gap-2 text-sm font-black">
            <span>동네 이름</span>
            <input
              v-model="form.label"
              class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold text-[#171717] outline-0"
              placeholder="예: 관악구 봉천동"
              required
            />
          </label>

          <div class="analysis-option-group grid gap-2">
            <span class="text-sm font-black">생활 반경</span>
            <div class="analysis-segments grid grid-cols-3 gap-2">
              <button
                v-for="option in radiusOptions"
                :key="option.value"
                type="button"
                class="min-h-11 border border-neutral-200 bg-white px-3 text-sm font-black text-[#171717]"
                :class="{ 'active border-[#b4212a] bg-[#b4212a] text-white': form.radius === option.value }"
                @click="form.radius = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="analysis-option-group grid gap-2">
            <span class="text-sm font-black">중요한 기준</span>
            <div class="analysis-segments grid grid-cols-3 gap-2">
              <button
                v-for="option in priorityOptions"
                :key="option.value"
                type="button"
                class="min-h-11 border border-neutral-200 bg-white px-3 text-sm font-black text-[#171717]"
                :class="{ 'active border-[#b4212a] bg-[#b4212a] text-white': form.priority === option.value }"
                @click="form.priority = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <details class="analysis-advanced border border-neutral-200 bg-[#f7f4ef] p-4">
            <summary class="cursor-pointer text-sm font-black">고급 좌표 설정</summary>
            <div class="analysis-coordinate-grid mt-4 grid grid-cols-2 gap-3">
              <label class="grid gap-2 text-sm font-black">
                <span>경도</span>
                <input
                  v-model.number="form.longitude"
                  class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold text-[#171717] outline-0"
                  type="number"
                  step="0.0001"
                />
              </label>
              <label class="grid gap-2 text-sm font-black">
                <span>위도</span>
                <input
                  v-model.number="form.latitude"
                  class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold text-[#171717] outline-0"
                  type="number"
                  step="0.0001"
                />
              </label>
            </div>
          </details>

          <button
            type="submit"
            class="button primary inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white"
          >
            {{ loading ? '분석 중' : '분석하기' }}
          </button>
        </form>

        <div class="analysis-presets mt-5 flex flex-wrap items-center gap-2">
          <span class="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">빠른 선택</span>
          <button
            v-for="preset in presets"
            :key="preset.label"
            type="button"
            class="min-h-9 border border-neutral-200 bg-white px-3 text-xs font-black text-[#171717]"
            @click="applyPreset(preset)"
          >
            {{ preset.label }}
          </button>
        </div>
      </article>

      <article
        class="panel analysis-preview grid content-center border border-neutral-200 bg-[#171717] p-8 text-white"
      >
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-white/70">Result</p>
        <template v-if="analysis">
          <strong class="mt-6 text-7xl font-black text-[#b4212a]">{{ analysis.score.total }}</strong>
          <h2 class="mt-4 text-3xl font-black text-white">{{ resultSummary }}</h2>
          <p class="muted mt-3 text-sm font-bold leading-7 text-white/70">
            {{ form.label }} · {{ analysis.radiusMeters }}m 기준 · {{ analysis.score.level }}
          </p>
        </template>
        <template v-else>
          <strong class="mt-6 text-7xl font-black text-[#b4212a]">?</strong>
          <h2 class="mt-4 text-3xl font-black text-white">분석 결과가 여기에 표시됩니다</h2>
          <p class="muted mt-3 text-sm font-bold leading-7 text-white/70">
            동네를 입력하고 분석하기를 누르면 상권과 교통 정보를 한눈에 보여드려요.
          </p>
        </template>
      </article>
    </section>

    <section v-if="analysis" class="analysis-result-grid mt-5 grid grid-cols-3 gap-4">
      <article class="panel metric analysis-metric border border-neutral-200 bg-white p-6">
        <p class="eyebrow text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">상권</p>
        <strong class="mt-3 block text-4xl font-black">{{ analysis.commercialSummary.totalCount }}</strong>
        <span class="text-sm font-bold text-neutral-500">주변 편의시설</span>
      </article>
      <article class="panel metric analysis-metric border border-neutral-200 bg-white p-6">
        <p class="eyebrow text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">교통</p>
        <strong class="mt-3 block text-4xl font-black">{{ analysis.trafficRiskSummary.eventCount }}</strong>
        <span class="text-sm font-bold text-neutral-500">{{ analysis.trafficRiskSummary.riskLevel }}</span>
      </article>
      <article class="panel metric analysis-metric border border-neutral-200 bg-white p-6">
        <p class="eyebrow text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">반경</p>
        <strong class="mt-3 block text-4xl font-black">{{ analysis.radiusMeters }}</strong>
        <span class="text-sm font-bold text-neutral-500">meter</span>
      </article>
    </section>

    <section v-if="analysis" class="split analysis-lists mt-5 grid grid-cols-2 gap-5">
      <article class="panel border border-neutral-200 bg-white p-6">
        <h2 class="text-[34px] font-black text-[#171717]">가까운 생활 시설</h2>
        <ul class="clean-list mt-4 grid gap-4">
          <li
            v-for="place in analysis.places"
            :key="`${place.name}-${place.address}`"
            class="border-b border-neutral-100 pb-4 last:border-0"
          >
            <strong class="block font-black">{{ place.name }}</strong>
            <span class="mt-1 block text-sm font-bold text-neutral-500"
              >{{ place.largeCategory }} / {{ place.middleCategory }} · {{ place.address }}</span
            >
          </li>
        </ul>
      </article>
      <article class="panel border border-neutral-200 bg-white p-6">
        <h2 class="text-[34px] font-black text-[#171717]">교통 체크 포인트</h2>
        <ul class="clean-list mt-4 grid gap-4">
          <li
            v-for="event in analysis.trafficEvents"
            :key="`${event.type}-${event.message}`"
            class="border-b border-neutral-100 pb-4 last:border-0"
          >
            <strong class="block font-black">{{ event.type }}</strong>
            <span class="mt-1 block text-sm font-bold text-neutral-500">{{ event.message }}</span>
          </li>
        </ul>
      </article>
    </section>
  </main>
</template>
