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
  <main class="shell page-shell">
    <div class="section-head">
      <div>
        <p class="eyebrow">Life Analysis</p>
        <h1 class="page-title">생활권 분석</h1>
        <p class="muted">동네 이름과 생활 반경만 고르면 상권과 교통 환경을 빠르게 비교합니다.</p>
      </div>
    </div>

    <section class="analysis-workspace">
      <article class="panel analysis-quick-form">
        <p class="eyebrow">Start</p>
        <h2>어디를 볼까요?</h2>
        <form class="analysis-form" @submit.prevent="analyze">
          <label>
            <span>동네 이름</span>
            <input v-model="form.label" placeholder="예: 관악구 봉천동" required />
          </label>

          <div class="analysis-option-group">
            <span>생활 반경</span>
            <div class="analysis-segments">
              <button
                v-for="option in radiusOptions"
                :key="option.value"
                type="button"
                :class="{ active: form.radius === option.value }"
                @click="form.radius = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="analysis-option-group">
            <span>중요한 기준</span>
            <div class="analysis-segments">
              <button
                v-for="option in priorityOptions"
                :key="option.value"
                type="button"
                :class="{ active: form.priority === option.value }"
                @click="form.priority = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <details class="analysis-advanced">
            <summary>고급 좌표 설정</summary>
            <div class="analysis-coordinate-grid">
              <label>
                <span>경도</span>
                <input v-model.number="form.longitude" type="number" step="0.0001" />
              </label>
              <label>
                <span>위도</span>
                <input v-model.number="form.latitude" type="number" step="0.0001" />
              </label>
            </div>
          </details>

          <button type="submit" class="button primary">{{ loading ? '분석 중' : '분석하기' }}</button>
        </form>

        <div class="analysis-presets">
          <span>빠른 선택</span>
          <button v-for="preset in presets" :key="preset.label" type="button" @click="applyPreset(preset)">
            {{ preset.label }}
          </button>
        </div>
      </article>

      <article class="panel analysis-preview">
        <p class="eyebrow">Result</p>
        <template v-if="analysis">
          <strong>{{ analysis.score.total }}</strong>
          <h2>{{ resultSummary }}</h2>
          <p class="muted">{{ form.label }} · {{ analysis.radiusMeters }}m 기준 · {{ analysis.score.level }}</p>
        </template>
        <template v-else>
          <strong>?</strong>
          <h2>분석 결과가 여기에 표시됩니다</h2>
          <p class="muted">동네를 입력하고 분석하기를 누르면 상권과 교통 정보를 한눈에 보여드려요.</p>
        </template>
      </article>
    </section>

    <section v-if="analysis" class="analysis-result-grid">
      <article class="panel metric analysis-metric">
        <p class="eyebrow">상권</p>
        <strong>{{ analysis.commercialSummary.totalCount }}</strong>
        <span>주변 편의시설</span>
      </article>
      <article class="panel metric analysis-metric">
        <p class="eyebrow">교통</p>
        <strong>{{ analysis.trafficRiskSummary.eventCount }}</strong>
        <span>{{ analysis.trafficRiskSummary.riskLevel }}</span>
      </article>
      <article class="panel metric analysis-metric">
        <p class="eyebrow">반경</p>
        <strong>{{ analysis.radiusMeters }}</strong>
        <span>meter</span>
      </article>
    </section>

    <section v-if="analysis" class="split analysis-lists">
      <article class="panel">
        <h2>가까운 생활 시설</h2>
        <ul class="clean-list">
          <li v-for="place in analysis.places" :key="`${place.name}-${place.address}`">
            <strong>{{ place.name }}</strong>
            <span>{{ place.largeCategory }} / {{ place.middleCategory }} · {{ place.address }}</span>
          </li>
        </ul>
      </article>
      <article class="panel">
        <h2>교통 체크 포인트</h2>
        <ul class="clean-list">
          <li v-for="event in analysis.trafficEvents" :key="`${event.type}-${event.message}`">
            <strong>{{ event.type }}</strong>
            <span>{{ event.message }}</span>
          </li>
        </ul>
      </article>
    </section>
  </main>
</template>

