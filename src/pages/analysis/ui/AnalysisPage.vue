<script setup>
import { reactive, ref } from 'vue'
import { api } from '@/shared/api/client'

const loading = ref(false)
const analysis = ref(null)
const form = reactive({
  label: '관악구 봉천동',
  longitude: 126.9413,
  latitude: 37.4826,
  radius: 1000,
})

async function analyze() {
  loading.value = true
  try {
    const { data } = await api.get('/analysis', { params: form })
    analysis.value = data
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
        <p class="muted">좌표와 반경을 기준으로 상권 접근성과 교통 위험도를 분석합니다.</p>
      </div>
    </div>

    <form class="search analysis-search" @submit.prevent="analyze">
      <input v-model="form.label" placeholder="분석 이름" />
      <input v-model.number="form.longitude" type="number" step="0.0001" placeholder="경도" />
      <input v-model.number="form.latitude" type="number" step="0.0001" placeholder="위도" />
      <input v-model.number="form.radius" type="number" placeholder="반경(m)" />
      <button type="submit">{{ loading ? '분석 중' : '분석하기' }}</button>
    </form>

    <section v-if="analysis" class="metric-grid">
      <article class="panel metric">
        <p class="eyebrow">Score</p>
        <strong>{{ analysis.score.total }}</strong>
        <span>{{ analysis.score.level }}</span>
      </article>
      <article class="panel metric">
        <p class="eyebrow">Commercial</p>
        <strong>{{ analysis.commercialSummary.totalCount }}</strong>
        <span>주변 상권</span>
      </article>
      <article class="panel metric">
        <p class="eyebrow">Traffic</p>
        <strong>{{ analysis.trafficRiskSummary.eventCount }}</strong>
        <span>{{ analysis.trafficRiskSummary.riskLevel }}</span>
      </article>
      <article class="panel metric">
        <p class="eyebrow">Radius</p>
        <strong>{{ analysis.radiusMeters }}</strong>
        <span>meter</span>
      </article>
    </section>

    <section v-if="analysis" class="split analysis-lists">
      <article class="panel">
        <h2>상권 데이터</h2>
        <ul class="clean-list">
          <li v-for="place in analysis.places" :key="`${place.name}-${place.address}`">
            <strong>{{ place.name }}</strong>
            <span>{{ place.largeCategory }} / {{ place.middleCategory }} · {{ place.address }}</span>
          </li>
        </ul>
      </article>
      <article class="panel">
        <h2>교통 이벤트</h2>
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

