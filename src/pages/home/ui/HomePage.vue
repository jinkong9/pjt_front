<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { api, toQuery } from '@/shared/api/client'
import EmptyState from '@/shared/ui/EmptyState.vue'
import LoadingState from '@/shared/ui/LoadingState.vue'

const router = useRouter()
const loading = ref(true)
const trades = ref([])
const popups = ref([])
const condition = ref({
  gugunName: '',
  keyword: '',
  dealYear: '',
})

async function loadHome() {
  loading.value = true
  try {
    const [recentRes, popupRes] = await Promise.all([
      api.get('/houses/recent', { params: { limit: 6 } }),
      api.get('/notices/popups', { params: { limit: 3 } }),
    ])
    trades.value = recentRes.data
    popups.value = popupRes.data
  } finally {
    loading.value = false
  }
}

function search() {
  router.push({
    path: '/prices',
    query: toQuery({ mode: 'search', ...condition.value }),
  })
}

onMounted(() => {
  document.title = 'SSAFY Home'
  loadHome()
})
</script>

<template>
  <main>
    <section v-if="popups.length" class="notice-strip">
      <strong>공지</strong>
      <RouterLink :to="`/notices/${popups[0].noticeId}`">{{ popups[0].title }}</RouterLink>
    </section>

    <section class="main-hero">
      <div class="main-hero-inner">
        <p class="eyebrow">Real Estate Data Platform</p>
        <h1>부동산 시세를<br />지도에서 바로 확인하세요</h1>
        <p class="muted">
          SSAFY Home은 실거래가 DB를 기반으로 아파트 시세를 검색하고, 공공임대와 생활권 분석을 함께 확인하는 주거 정보 서비스입니다.
        </p>

        <form class="main-search" @submit.prevent="search">
          <input v-model="condition.gugunName" placeholder="구/군 예: 강남구" />
          <input v-model="condition.keyword" placeholder="아파트명" />
          <input v-model="condition.dealYear" placeholder="거래연도" />
          <button type="submit">지도에서 보기</button>
        </form>
      </div>
    </section>

    <section class="shell">
      <div class="section-head">
        <div>
          <p class="eyebrow">Market Price</p>
          <h2>최근 부동산 실거래</h2>
          <p class="muted">상단 검색 또는 부동산 시세 메뉴를 누르면 PJT처럼 지도 화면으로 이동합니다.</p>
        </div>
        <RouterLink class="button primary" to="/prices">부동산 시세 보기</RouterLink>
      </div>

      <LoadingState v-if="loading" />
      <EmptyState v-else-if="!trades.length" message="표시할 실거래 정보가 없습니다." />
      <div v-else class="grid">
        <article v-for="trade in trades" :key="trade.no" class="card">
          <span class="tag">APT SALE</span>
          <h3>{{ trade.aptName }}</h3>
          <p class="muted">{{ trade.address }}</p>
          <p>
            <strong>{{ trade.dealAmount }}만원</strong><br />
            <span>{{ trade.dealDate }}</span>
            · 전용 {{ trade.exclusiveArea }}㎡ · {{ trade.floor }}층
          </p>
          <RouterLink
            class="button primary"
            :to="{ path: '/prices', query: { mode: 'search', keyword: trade.aptName, gugunName: trade.gugunName } }"
          >
            지도에서 보기
          </RouterLink>
        </article>
      </div>
    </section>

    <section class="main-band">
      <div class="shell split">
        <article class="panel">
          <p class="eyebrow">Public Rental</p>
          <h2>공공임대는 서브 서비스로 확인</h2>
          <p class="muted">LH 공공임대 공고를 목록과 상세 페이지에서 확인할 수 있습니다.</p>
          <RouterLink class="button primary" to="/rentals">공공임대 보기</RouterLink>
        </article>
        <article class="panel">
          <p class="eyebrow">Transfer & Calendar</p>
          <h2>양도 게시판과 LH 캘린더</h2>
          <p class="muted">전월세 양도글과 LH 모집 일정을 같은 흐름에서 확인합니다.</p>
          <div class="action-row">
            <RouterLink class="button" to="/transfers">양도 게시판</RouterLink>
            <RouterLink class="button primary" to="/lh-calendar">LH 캘린더</RouterLink>
          </div>
        </article>
      </div>
    </section>
  </main>
</template>

