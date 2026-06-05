<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { api, toQuery } from '@/shared/api/client'
import EmptyState from '@/shared/ui/EmptyState.vue'
import LoadingState from '@/shared/ui/LoadingState.vue'

const router = useRouter()
const loading = ref(true)
const trades = ref([])
const popups = ref([])
const activeSection = ref(0)
let sectionObserver
let scrollContainer
let wheelCleanup
let isSectionScrolling = false
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
  } catch {
    trades.value = []
    popups.value = []
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

function easeInOutCubic(progress) {
  return progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2
}

function animateSectionScroll(targetTop) {
  if (!scrollContainer) return

  const startTop = scrollContainer.scrollTop
  const distance = targetTop - startTop
  const duration = 1050
  const startTime = performance.now()
  isSectionScrolling = true

  function step(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    scrollContainer.scrollTop = startTop + distance * easeInOutCubic(progress)

    if (progress < 1) {
      requestAnimationFrame(step)
      return
    }

    scrollContainer.scrollTop = targetTop
    window.setTimeout(() => {
      isSectionScrolling = false
    }, 120)
  }

  requestAnimationFrame(step)
}

function bindFullpageWheel() {
  scrollContainer = document.querySelector('.fullpage-scroll')
  const sections = [...document.querySelectorAll('.fullpage-section')]
  if (!scrollContainer || sections.length === 0) return

  function onWheel(event) {
    if (Math.abs(event.deltaY) < 18) return
    event.preventDefault()

    if (isSectionScrolling) return

    const direction = event.deltaY > 0 ? 1 : -1
    const nextIndex = Math.min(Math.max(activeSection.value + direction, 0), sections.length - 1)
    if (nextIndex === activeSection.value) return

    activeSection.value = nextIndex
    animateSectionScroll(sections[nextIndex].offsetTop)
  }

  scrollContainer.addEventListener('wheel', onWheel, { passive: false })
  wheelCleanup = () => scrollContainer?.removeEventListener('wheel', onWheel)
}

onMounted(() => {
  document.title = 'SSAFY Home'
  loadHome()
  nextTick(() => {
    if (!window.IntersectionObserver) {
      activeSection.value = 0
      return
    }

    const sections = document.querySelectorAll('.fullpage-section')
    sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visibleEntry) {
          activeSection.value = Number(visibleEntry.target.dataset.sectionIndex)
        }
      },
      {
        root: document.querySelector('.fullpage-scroll'),
        threshold: [0.58, 0.78],
      },
    )
    sections.forEach((section) => sectionObserver.observe(section))
    bindFullpageWheel()
  })
})

onBeforeUnmount(() => {
  sectionObserver?.disconnect()
  wheelCleanup?.()
})
</script>

<template>
  <main class="home-page fullpage-scroll">
    <section v-if="popups.length" class="notice-strip">
      <strong>공지</strong>
      <RouterLink :to="`/notices/${popups[0].noticeId}`">{{ popups[0].title }}</RouterLink>
    </section>

    <section class="main-hero home-hero fullpage-section" data-section-index="0">
      <div class="main-hero-inner fullpage-reveal" :class="{ 'is-visible': activeSection === 0 }">
        <p class="eyebrow">Real Estate Data Platform</p>
        <h1>FIND YOUR HOME,<br />BETTER YOUR LIFE</h1>
        <p class="hero-copy">
          공공 데이터를 기반으로 아파트 실거래 정보와 지역별 주택 흐름을 빠르게 확인하세요.
        </p>

        <form class="main-search" @submit.prevent="search">
          <label>
            <span>지역</span>
            <input v-model="condition.gugunName" placeholder="구군을 입력하세요" />
          </label>
          <label>
            <span>아파트</span>
            <input v-model="condition.keyword" placeholder="아파트명을 입력하세요" />
          </label>
          <label>
            <span>추천 지역</span>
            <input v-model="condition.dealYear" placeholder="강남구 서초구 송파구 종로구" />
          </label>
          <button type="submit">검색</button>
        </form>
      </div>
    </section>

    <section class="home-section fullpage-section" data-section-index="1">
      <div class="shell fullpage-reveal" :class="{ 'is-visible': activeSection === 1 }">
        <div class="section-head">
          <div>
            <p class="eyebrow">Market Price</p>
            <h2>최근 부동산 실거래</h2>
            <p class="muted">상단 검색 또는 부동산 시세 메뉴를 누르면 지도 화면으로 이동합니다.</p>
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
      </div>
    </section>

    <section class="home-section home-feature-section fullpage-section" data-section-index="2">
      <div class="shell fullpage-reveal" :class="{ 'is-visible': activeSection === 2 }">
        <div class="section-head">
          <div>
            <p class="eyebrow">Services</p>
            <h2>필요한 주거 기능을 바로 선택하세요</h2>
          </div>
        </div>
        <div class="feature-rail">
          <RouterLink class="feature-panel" to="/rentals">
            <span class="tag">Public Rental</span>
            <strong>공공임대 일정</strong>
            <small>LH 공고 목록과 상세 공급 정보를 확인합니다.</small>
          </RouterLink>
          <RouterLink class="feature-panel" to="/lh-calendar">
            <span class="tag">LH Calendar</span>
            <strong>LH 캘린더</strong>
            <small>공고일, 접수 시작, 접수 마감일을 월간 일정으로 봅니다.</small>
          </RouterLink>
          <RouterLink class="feature-panel" to="/transfers">
            <span class="tag">Transfer</span>
            <strong>양도 게시판</strong>
            <small>계약 기간이 남은 전월세 양도글을 확인합니다.</small>
          </RouterLink>
          <RouterLink class="feature-panel" to="/analysis">
            <span class="tag">Life Analysis</span>
            <strong>생활권 분석</strong>
            <small>상권과 교통 이벤트를 기준으로 후보지를 비교합니다.</small>
          </RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>

