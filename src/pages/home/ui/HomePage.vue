<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { A11y, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { api } from '@/shared/api/client'
import { fetchRentalNotices } from '@/entities/rental/api/rentalApi'
import EmptyState from '@/shared/ui/EmptyState.vue'
import LoadingState from '@/shared/ui/LoadingState.vue'

const router = useRouter()
const loading = ref(true)
const rentalNotices = ref([])
const popups = ref([])
const activeSection = ref(0)
let sectionObserver
let scrollContainer
let wheelCleanup
let isSectionScrolling = false
const rentalSwiperModules = [Navigation, Pagination, A11y]
const defaultPriceMapQuery = {
  mode: 'region',
  sidoName: '서울특별시',
  gugunName: '강남구',
  limit: 20,
}

async function loadHome() {
  loading.value = true
  try {
    const [rentalData, popupRes] = await Promise.all([
      fetchRentalNotices({ size: 6 }),
      api.get('/notices/popups', { params: { limit: 3 } }),
    ])
    rentalNotices.value = rentalData
    popups.value = popupRes.data
  } catch {
    rentalNotices.value = []
    popups.value = []
  } finally {
    loading.value = false
  }
}

function search() {
  router.push({
    path: '/prices',
    query: defaultPriceMapQuery,
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
  <main
    class="home-page fullpage-scroll h-screen overflow-y-auto scroll-smooth bg-[#f4f0ea] [scroll-snap-type:y_mandatory]"
  >
    <section
      v-if="popups.length"
      class="notice-strip fixed left-1/2 top-24 z-20 flex -translate-x-1/2 items-center gap-3 border border-white/20 bg-black/45 px-5 py-3 text-sm font-black text-white backdrop-blur"
    >
      <strong>공지</strong>
      <RouterLink :to="`/notices/${popups[0].noticeId}`">{{ popups[0].title }}</RouterLink>
    </section>

    <section
      class="main-hero home-hero fullpage-section relative grid h-screen min-h-screen items-center overflow-hidden bg-[linear-gradient(90deg,rgba(0,0,0,0.62),rgba(0,0,0,0.28)),linear-gradient(180deg,rgba(0,0,0,0.18),rgba(0,0,0,0.45)),url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2400&q=90')] bg-cover bg-center text-white [scroll-snap-align:start] [scroll-snap-stop:always]"
      data-section-index="0"
    >
      <div
        class="main-hero-inner fullpage-reveal relative z-[1] mx-auto w-[min(1480px,calc(100%_-_48px))] px-0 pb-[72px] pt-[132px]"
        :class="{ 'is-visible': activeSection === 0 }"
      >
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-white/80">
          Real Estate Data Platform
        </p>
        <h1
          class="mt-[18px] max-w-[1060px] text-[clamp(52px,7vw,96px)] font-black uppercase leading-[0.96] text-white"
        >
          FIND YOUR HOME,<br />BETTER YOUR LIFE
        </h1>
        <p class="hero-copy mt-7 max-w-[640px] text-base font-bold leading-7 text-white/85">
          공공 데이터를 기반으로 아파트 실거래 정보와 지역별 주택 흐름을 빠르게 확인하세요.
        </p>

        <form class="main-search mt-9 inline-flex w-fit bg-transparent shadow-none" @submit.prevent="search">
          <button
            type="submit"
            class="inline-flex min-h-[76px] items-center justify-center border border-[#b4212a] bg-[#b4212a] px-10 font-black text-white"
          >
            지도에서 시세확인하기
          </button>
        </form>
      </div>
    </section>

    <section
      class="home-section home-rental-section fullpage-section grid h-screen min-h-screen content-center bg-[#f4f0ea] [scroll-snap-align:start] [scroll-snap-stop:always]"
      data-section-index="1"
    >
      <div
        class="shell fullpage-reveal mx-auto w-[min(1480px,calc(100%_-_48px))] py-9"
        :class="{ 'is-visible': activeSection === 1 }"
      >
        <div class="section-head rental-section-head mb-5 flex items-center justify-between gap-6">
          <div>
            <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
              Public Rental
            </p>
            <h2 class="mt-2 text-[clamp(28px,3vw,42px)] font-black text-[#171717]">LH 공고</h2>
            <p class="muted mt-2.5 text-sm font-bold leading-7 text-neutral-500">
              접수 일정과 지역을 빠르게 훑고 관심 공고의 상세 정보를 확인합니다.
            </p>
          </div>
          <RouterLink
            class="button primary inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white"
            to="/rentals"
            >공공임대 전체 보기</RouterLink
          >
        </div>

        <LoadingState v-if="loading && !rentalNotices.length" />
        <EmptyState v-else-if="!rentalNotices.length" message="표시할 LH 공고가 없습니다." />
        <div v-else class="rental-slider-shell relative grid grid-cols-[52px_minmax(0,1fr)_52px] items-center gap-3.5">
          <button
            type="button"
            class="rental-window-button rental-window-prev inline-flex min-h-[52px] w-[52px] items-center justify-center border border-[#171717] bg-white p-0 text-xl font-black text-[#171717]"
            aria-label="이전 LH 공고"
          >
            ←
          </button>
          <Swiper
            class="rental-swiper w-full overflow-hidden border border-neutral-200 bg-white p-[18px]"
            :modules="rentalSwiperModules"
            :slides-per-view="3"
            :slides-per-group="3"
            :space-between="14"
            :rewind="true"
            :navigation="{ prevEl: '.rental-window-prev', nextEl: '.rental-window-next' }"
            :pagination="{ clickable: true, el: '.rental-swiper-pagination' }"
            :a11y="{ prevSlideMessage: '이전 LH 공고', nextSlideMessage: '다음 LH 공고' }"
            :breakpoints="{
              0: { slidesPerView: 1, slidesPerGroup: 1, spaceBetween: 12 },
              720: { slidesPerView: 2, slidesPerGroup: 2, spaceBetween: 14 },
              1100: { slidesPerView: 3, slidesPerGroup: 3, spaceBetween: 14 },
            }"
          >
            <SwiperSlide v-for="notice in rentalNotices" :key="notice.noticeId">
              <RouterLink
                class="rental-slide-card grid min-h-[220px] content-between gap-3.5 border border-neutral-200 bg-white p-[22px] text-[#171717]"
                :to="`/rentals/${notice.noticeId}`"
              >
                <span class="text-xs font-black uppercase tracking-[0.2em] text-[#b4212a]">{{
                  notice.status || 'LH'
                }}</span>
                <strong class="text-[22px] font-black leading-tight">{{ notice.title }}</strong>
                <small class="text-[13px] font-extrabold text-neutral-500"
                  >{{ notice.regionName }} · {{ notice.noticeType }} · {{ notice.detailType }}</small
                >
                <em class="text-[13px] font-black not-italic text-[#171717]"
                  >접수 {{ notice.applyStartDate || '-' }} -
                  {{ notice.applyEndDate || notice.closeDate || '-' }}</em
                >
              </RouterLink>
            </SwiperSlide>
          </Swiper>
          <button
            type="button"
            class="rental-window-button rental-window-next inline-flex min-h-[52px] w-[52px] items-center justify-center border border-[#171717] bg-white p-0 text-xl font-black text-[#171717]"
            aria-label="다음 LH 공고"
          >
            →
          </button>
          <div class="rental-swiper-pagination col-start-2 flex min-h-3.5 justify-center gap-2"></div>
        </div>
      </div>
    </section>

    <section
      class="home-section home-feature-section fullpage-section grid h-screen min-h-screen content-center bg-white [scroll-snap-align:start] [scroll-snap-stop:always]"
      data-section-index="2"
    >
      <div
        class="shell fullpage-reveal mx-auto w-[min(1480px,calc(100%_-_48px))] py-9"
        :class="{ 'is-visible': activeSection === 2 }"
      >
        <div class="section-head mb-8 flex items-end justify-between gap-6">
          <div>
            <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
              Services
            </p>
            <h2 class="mt-2 text-[34px] font-black text-[#171717]">필요한 주거 기능을 바로 선택하세요</h2>
          </div>
        </div>
        <div class="feature-rail grid grid-cols-4 gap-4">
          <RouterLink
            class="feature-panel grid min-h-[260px] content-between border border-neutral-200 bg-white p-[26px] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(23,23,23,0.12)]"
            to="/rentals"
          >
            <span class="tag w-fit bg-[#f7f4ef] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]">Public Rental</span>
            <strong class="mt-10 block text-[26px] font-black leading-tight">공공임대 일정</strong>
            <small class="block text-sm font-bold leading-6 text-neutral-500">LH 공고 목록과 상세 공급 정보를 확인합니다.</small>
          </RouterLink>
          <RouterLink class="feature-panel grid min-h-[260px] content-between border border-neutral-200 bg-white p-[26px] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(23,23,23,0.12)]" to="/lh-calendar">
            <span class="tag w-fit bg-[#f7f4ef] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]">LH Calendar</span>
            <strong class="mt-10 block text-[26px] font-black leading-tight">LH 캘린더</strong>
            <small class="block text-sm font-bold leading-6 text-neutral-500">공고일, 접수 시작, 접수 마감일을 월간 일정으로 봅니다.</small>
          </RouterLink>
          <RouterLink class="feature-panel grid min-h-[260px] content-between border border-neutral-200 bg-white p-[26px] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(23,23,23,0.12)]" to="/transfers">
            <span class="tag w-fit bg-[#f7f4ef] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]">Transfer</span>
            <strong class="mt-10 block text-[26px] font-black leading-tight">양도 게시판</strong>
            <small class="block text-sm font-bold leading-6 text-neutral-500">계약 기간이 남은 전월세 양도글을 확인합니다.</small>
          </RouterLink>
          <RouterLink class="feature-panel grid min-h-[260px] content-between border border-neutral-200 bg-white p-[26px] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(23,23,23,0.12)]" to="/analysis">
            <span class="tag w-fit bg-[#f7f4ef] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]">Life Analysis</span>
            <strong class="mt-10 block text-[26px] font-black leading-tight">생활권 분석</strong>
            <small class="block text-sm font-bold leading-6 text-neutral-500">상권과 교통 이벤트를 기준으로 후보지를 비교합니다.</small>
          </RouterLink>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.home-hero::after {
  content: '';
  position: absolute;
  inset: auto 0 0;
  height: 28vh;
  background: linear-gradient(180deg, rgba(244, 240, 234, 0), #f4f0ea);
  pointer-events: none;
}

.fullpage-reveal {
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity 0.85s ease,
    transform 0.85s cubic-bezier(0.22, 1, 0.36, 1);
  transition-delay: 0.32s;
  will-change: opacity, transform;
}

.fullpage-reveal.is-visible {
  opacity: 1;
  transform: translateY(0);
}

:deep(.rental-swiper .swiper-wrapper) {
  align-items: stretch;
}

:deep(.rental-swiper-pagination .swiper-pagination-bullet) {
  width: 26px;
  height: 4px;
  margin: 0;
  border-radius: 0;
  background: #d9d4cc;
  opacity: 1;
}

:deep(.rental-swiper-pagination .swiper-pagination-bullet-active) {
  background: #b4212a;
}

@media (prefers-reduced-motion: reduce) {
  .home-page {
    scroll-behavior: auto;
  }

  .fullpage-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
