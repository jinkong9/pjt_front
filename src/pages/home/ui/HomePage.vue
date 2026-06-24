<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { RouterLink, useRouter } from 'vue-router'
import { A11y, Navigation, Pagination } from 'swiper/modules'
import { Swiper, SwiperSlide } from 'swiper/vue'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import { rentalQueryOptions } from '@/entities/rental/model/rentalQueries'
import { appQueryOptions } from '@/shared/query/appQueries'
import EmptyState from '@/shared/ui/EmptyState.vue'
import LoadingState from '@/shared/ui/LoadingState.vue'

const router = useRouter()
const dismissedPopupIds = ref([])
const activeSection = ref(0)
let sectionObserver
const rentalSwiperModules = [Navigation, Pagination, A11y]
const noticePopupStorageKey = 'happyhome.noticePopupHiddenUntil'
const defaultPriceMapQuery = {
  mode: 'region',
  sidoName: '서울특별시',
  gugunName: '강남구',
  limit: 20,
}

const visiblePopup = computed(() =>
  popups.value.find((popup) => !dismissedPopupIds.value.includes(String(popup.noticeId))),
)
const homeRentalsQuery = useQuery(rentalQueryOptions.list({ size: 6 }))
const popupsQuery = useQuery(appQueryOptions.noticePopups(3))
const rentalNotices = computed(() => homeRentalsQuery.data.value ?? [])
const popups = computed(() => popupsQuery.data.value ?? [])
const loading = computed(() => homeRentalsQuery.isPending.value)
const serviceStories = [
  {
    eyebrow: 'Price Map',
    title: '실거래가를 지도에서 바로 읽고',
    copy: '아파트 이름을 몰라도 지역을 기준으로 최근 거래 흐름을 먼저 확인합니다. 가격은 억 단위로 읽기 쉽게 정리하고, 선택한 매물은 상세 분석으로 이어집니다.',
    to: '/prices',
    cta: '실거래 지도 보기',
    stat: '3.5억',
    statLabel: '최근 거래가',
    rows: [
      ['강남구 대치동', '84㎡ · 12층'],
      ['송파구 잠실동', '59㎡ · 8층'],
      ['마포구 아현동', '74㎡ · 5층'],
    ],
  },
  {
    eyebrow: 'LH Match',
    title: '내 조건에 맞는 LH 공고를 놓치지 않게',
    copy: '금융 프로필과 희망 지역, 세대 조건을 기반으로 볼 만한 공공임대 공고를 먼저 보여줍니다. 관심 등록한 공고는 마이페이지에서 다시 확인할 수 있습니다.',
    to: '/rentals',
    cta: 'LH 공고 보기',
    stat: '92',
    statLabel: '추천 점수',
    rows: [
      ['임대주택', '행복주택 · 청년'],
      ['희망 지역', '서울 · 경기'],
      ['접수 일정', '마감 전 알림'],
    ],
  },
  {
    eyebrow: 'Transfer Board',
    title: '양도 매물까지 한 흐름으로 비교하고',
    copy: '보증금, 월세, 관리비, 양도비를 같은 기준으로 읽고 상세 화면으로 바로 이동합니다. 실거래와 양도 매물을 번갈아 보며 현실적인 선택지를 좁힙니다.',
    to: '/transfers',
    cta: '양도 게시판 보기',
    stat: '1억',
    statLabel: '보증금',
    rows: [
      ['월세', '3,000만원'],
      ['양도비', '3.5억'],
      ['상태', '양도가능'],
    ],
  },
]

function readHiddenPopupMap() {
  try {
    return JSON.parse(localStorage.getItem(noticePopupStorageKey) || '{}')
  } catch {
    return {}
  }
}

function refreshHiddenPopups() {
  const now = Date.now()
  dismissedPopupIds.value = Object.entries(readHiddenPopupMap())
    .filter(([, hiddenUntil]) => Number(hiddenUntil) > now)
    .map(([noticeId]) => noticeId)
}

function closeNoticePopup() {
  if (!visiblePopup.value) return
  dismissedPopupIds.value = [...dismissedPopupIds.value, String(visiblePopup.value.noticeId)]
}

function hideNoticePopupToday() {
  if (!visiblePopup.value) return
  const hiddenPopupMap = readHiddenPopupMap()
  hiddenPopupMap[String(visiblePopup.value.noticeId)] = Date.now() + 24 * 60 * 60 * 1000
  localStorage.setItem(noticePopupStorageKey, JSON.stringify(hiddenPopupMap))
  closeNoticePopup()
}

function search() {
  router.push({
    path: '/prices',
    query: defaultPriceMapQuery,
  })
}

onMounted(() => {
  document.title = 'HOME FIT'
  refreshHiddenPopups()
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
        root: null,
        rootMargin: '-18% 0px -30% 0px',
        threshold: [0.18, 0.36, 0.58],
      },
    )
    sections.forEach((section) => sectionObserver.observe(section))
  })
})

onBeforeUnmount(() => {
  sectionObserver?.disconnect()
})
</script>

<template>
  <main class="home-page natural-scroll bg-[#f4f0ea]">
    <div
      v-if="visiblePopup"
      class="home-notice-popup fixed inset-0 z-40 grid place-items-center bg-black/68 px-4"
      data-testid="notice-popup"
    >
      <section
        class="w-[min(460px,calc(100vw-32px))] border border-neutral-200 bg-white text-[#171717] shadow-[0_24px_80px_rgba(0,0,0,0.34)]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="home-notice-popup-title"
      >
        <div class="flex items-start justify-between gap-5 border-b border-neutral-200 px-6 py-5">
          <div>
            <p class="m-0 text-[11px] font-black uppercase tracking-[0.28em] text-[#b4212a]">
              Notice
            </p>
            <h2
              id="home-notice-popup-title"
              class="mt-2 text-[26px] font-black leading-tight text-[#171717]"
            >
              {{ visiblePopup.title }}
            </h2>
          </div>
          <button
            type="button"
            class="grid min-h-9 w-9 shrink-0 place-items-center border border-neutral-200 bg-white p-0 text-sm font-black text-neutral-500 hover:border-[#171717] hover:text-[#171717]"
            aria-label="공지 닫기"
            data-testid="notice-close"
            @click="closeNoticePopup"
          >
            X
          </button>
        </div>
        <div class="px-6 py-6">
          <p class="m-0 text-sm font-bold leading-7 text-neutral-600">
            {{ visiblePopup.content || '서버 안정화를 위해 점검이 시작됩니다.' }}
          </p>
          <RouterLink
            class="mt-6 inline-flex min-h-11 items-center justify-center bg-[#171717] px-5 text-sm font-black text-white hover:bg-[#333333]"
            :to="`/notices/${visiblePopup.noticeId}`"
          >
            공지사항 보기
            <span class="ml-2 text-base leading-none">→</span>
          </RouterLink>
        </div>
        <div class="flex items-center justify-between gap-4 border-t border-neutral-200 bg-[#f7f4ef] px-6 py-4">
          <button
            type="button"
            class="min-h-10 border border-neutral-300 bg-white px-4 text-sm font-black text-neutral-600 hover:border-neutral-500"
            data-testid="notice-hide-today"
            @click="hideNoticePopupToday"
          >
            하루동안 보지 않기
          </button>
          <button
            type="button"
            class="min-h-10 bg-[#b4212a] px-5 text-sm font-black text-white hover:bg-[#921b22]"
            data-testid="notice-close-bottom"
            @click="closeNoticePopup"
          >
            닫기
          </button>
        </div>
      </section>
    </div>

    <section
      class="main-hero home-hero fullpage-section relative grid min-h-[92vh] items-center overflow-hidden bg-[linear-gradient(90deg,rgba(255,255,255,0.9),rgba(255,255,255,0.58)),linear-gradient(180deg,rgba(255,255,255,0.36),rgba(244,240,234,0.9)),url('https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=2400&q=92')] bg-cover bg-center text-[#171717]"
      data-section-index="0"
    >
      <div
        class="main-hero-inner fullpage-reveal relative z-[1] mx-auto w-[min(1480px,calc(100%_-_48px))] px-0 pb-[72px] pt-[132px]"
        :class="{ 'is-visible': activeSection === 0 }"
      >
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
          Real Estate Data Platform
        </p>
        <h1
          class="mt-[18px] max-w-[1060px] text-[clamp(52px,7vw,96px)] font-black uppercase leading-[0.96] text-[#171717]"
        >
          FIND YOUR HOME,<br />BETTER YOUR LIFE
        </h1>
        <p class="hero-copy mt-7 max-w-[640px] text-base font-bold leading-7 text-neutral-600">
          공공 데이터를 기반으로 아파트 실거래 정보와 지역별 주택 흐름을 빠르게 확인하세요.
        </p>

        <form
          class="main-search mt-9 inline-flex w-fit bg-transparent shadow-none"
          @submit.prevent="search"
        >
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
      v-for="(story, index) in serviceStories"
      :key="story.eyebrow"
      class="home-story-section fullpage-section grid min-h-[88vh] content-center overflow-hidden py-20"
      :class="index % 2 === 0 ? 'bg-white' : 'bg-[#f4f0ea]'"
      :data-section-index="index + 1"
      data-testid="home-service-story"
    >
      <div
        class="home-story-grid fullpage-reveal mx-auto grid w-[min(1480px,calc(100%_-_48px))] items-center gap-12 py-12 lg:grid-cols-[minmax(0,0.88fr)_minmax(460px,1fr)]"
        :class="[
          { 'is-visible': activeSection === index + 1 },
          index % 2 === 1 ? 'lg:[&_.home-story-visual]:order-first' : '',
        ]"
      >
        <div class="home-story-copy">
          <p class="m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
            {{ story.eyebrow }}
          </p>
          <h2 class="mt-5 max-w-[760px] text-[clamp(42px,5.5vw,82px)] font-black leading-[1.02] text-[#171717]">
            {{ story.title }}
          </h2>
          <p class="mt-7 max-w-[620px] text-[17px] font-bold leading-8 text-neutral-500">
            {{ story.copy }}
          </p>
          <RouterLink
            class="mt-9 inline-flex min-h-12 items-center justify-center border border-[#171717] bg-[#171717] px-6 text-sm font-black text-white transition hover:bg-[#b4212a]"
            :to="story.to"
          >
            {{ story.cta }}
          </RouterLink>
        </div>

        <div class="home-story-visual relative">
          <div class="home-product-shell border border-neutral-200 bg-white p-5 text-[#171717] shadow-[0_30px_80px_rgba(116,104,88,0.14)]">
            <div class="flex items-center justify-between border-b border-neutral-200 pb-5">
              <span class="text-[11px] font-black uppercase tracking-[0.24em] text-neutral-500">HOME FIT</span>
              <span class="border border-neutral-300 bg-[#faf8f5] px-3 py-1 text-xs font-black text-[#b4212a]">Live</span>
            </div>
            <div class="py-8">
              <span class="text-sm font-black text-neutral-500">{{ story.statLabel }}</span>
              <strong class="home-product-stat mt-3 block text-[clamp(54px,7vw,92px)] font-black leading-none text-[#b4212a]">
                {{ story.stat }}
              </strong>
            </div>
            <div class="grid gap-3">
              <div
                v-for="row in story.rows"
                :key="row[0]"
                class="home-product-row flex items-center justify-between gap-5 border border-neutral-200 bg-[#faf8f5] px-5 py-4"
              >
                <span class="text-sm font-black text-neutral-500">{{ row[0] }}</span>
                <strong class="text-right text-base font-black text-[#171717]">{{ row[1] }}</strong>
              </div>
            </div>
          </div>
          <div class="home-product-note mt-5 border border-neutral-200 bg-white px-5 py-4 text-sm font-black text-[#171717]">
            공공 데이터, 관심 매물, 금융 프로필을 한 화면 흐름으로 연결합니다.
          </div>
        </div>
      </div>
    </section>

    <section
      class="home-section home-rental-section fullpage-section grid min-h-[88vh] content-center bg-[#f4f0ea] py-20"
      data-section-index="4"
    >
      <div
        class="shell fullpage-reveal mx-auto w-[min(1720px,calc(100%_-_72px))] py-6"
        :class="{ 'is-visible': activeSection === 4 }"
      >
        <div class="section-head rental-section-head mb-8 flex items-center justify-between gap-6">
          <div>
            <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
              Public Rental
            </p>
            <h2 class="mt-2 text-[clamp(30px,2.7vw,44px)] font-black text-[#171717]">LH 공고</h2>
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
        <div
          v-else
          class="rental-slider-shell relative grid grid-cols-[68px_minmax(0,1fr)_68px] items-center gap-5"
        >
          <button
            type="button"
            class="rental-window-button rental-window-prev inline-flex min-h-[68px] w-[68px] items-center justify-center border border-[#171717] bg-white p-0 text-2xl font-black text-[#171717]"
            aria-label="이전 LH 공고"
          >
            ←
          </button>
          <Swiper
            class="rental-swiper w-full overflow-hidden border border-neutral-200 bg-white p-[28px]"
            :modules="rentalSwiperModules"
            :slides-per-view="3"
            :slides-per-group="3"
            :space-between="22"
            :rewind="true"
            :navigation="{ prevEl: '.rental-window-prev', nextEl: '.rental-window-next' }"
            :pagination="{ clickable: true, el: '.rental-swiper-pagination' }"
            :a11y="{ prevSlideMessage: '이전 LH 공고', nextSlideMessage: '다음 LH 공고' }"
            :breakpoints="{
              0: { slidesPerView: 1, slidesPerGroup: 1, spaceBetween: 14 },
              720: { slidesPerView: 2, slidesPerGroup: 2, spaceBetween: 18 },
              1100: { slidesPerView: 3, slidesPerGroup: 3, spaceBetween: 22 },
            }"
          >
            <SwiperSlide
              v-for="notice in rentalNotices"
              :key="notice.noticeId"
              class="h-auto"
            >
              <RouterLink
                class="rental-slide-card grid h-full min-h-[310px] content-between gap-5 border border-neutral-200 bg-white p-[34px] text-[#171717]"
                :to="`/rentals/${notice.noticeId}`"
              >
                <span class="text-sm font-black uppercase tracking-[0.2em] text-[#b4212a]">{{
                  notice.status || 'LH'
                }}</span>
                <strong class="text-[clamp(24px,1.45vw,30px)] font-black leading-tight">{{ notice.title }}</strong>
                <small class="text-[15px] font-extrabold leading-6 text-neutral-500"
                  >{{ notice.regionName }} · {{ notice.noticeType }} ·
                  {{ notice.detailType }}</small
                >
                <div class="mt-2 flex items-end justify-between gap-4">
                  <em class="text-[15px] font-black not-italic text-[#171717]"
                    >접수 {{ notice.noticeDate || '-' }} ~
                    {{ notice.applyEndDate || notice.closeDate || '-' }}</em
                  >
                  <span
                    class="inline-flex min-h-10 shrink-0 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-4 text-xs font-black text-white"
                  >
                    바로가기
                  </span>
                </div>
              </RouterLink>
            </SwiperSlide>
          </Swiper>
          <button
            type="button"
            class="rental-window-button rental-window-next inline-flex min-h-[68px] w-[68px] items-center justify-center border border-[#171717] bg-white p-0 text-2xl font-black text-[#171717]"
            aria-label="다음 LH 공고"
          >
            →
          </button>
          <div
            class="rental-swiper-pagination col-start-2 flex min-h-3.5 justify-center gap-2"
          ></div>
        </div>
      </div>
    </section>

    <section
      class="home-section home-feature-section fullpage-section grid min-h-[82vh] content-center bg-white py-20"
      data-section-index="5"
    >
      <div
        class="shell fullpage-reveal mx-auto w-[min(1480px,calc(100%_-_48px))] py-9"
        :class="{ 'is-visible': activeSection === 5 }"
      >
        <div class="section-head mb-8 flex items-end justify-between gap-6">
          <div>
            <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
              Services
            </p>
            <h2 class="mt-2 text-[34px] font-black text-[#171717]">
              필요한 주거 기능을 바로 선택하세요
            </h2>
          </div>
        </div>
        <div class="feature-rail grid grid-cols-4 gap-4">
          <RouterLink
            class="feature-panel grid min-h-[260px] content-between border border-neutral-200 bg-white p-[26px] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(23,23,23,0.12)]"
            to="/rentals"
          >
            <span
              class="tag w-fit bg-[#f7f4ef] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]"
              >Public Rental</span
            >
            <strong class="mt-10 block text-[26px] font-black leading-tight">공공임대 일정</strong>
            <small class="block text-sm font-bold leading-6 text-neutral-500"
              >LH 공고 목록과 상세 공급 정보를 확인합니다.</small
            >
          </RouterLink>
          <RouterLink
            class="feature-panel grid min-h-[260px] content-between border border-neutral-200 bg-white p-[26px] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(23,23,23,0.12)]"
            to="/lh-calendar"
          >
            <span
              class="tag w-fit bg-[#f7f4ef] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]"
              >LH Calendar</span
            >
            <strong class="mt-10 block text-[26px] font-black leading-tight">LH 캘린더</strong>
            <small class="block text-sm font-bold leading-6 text-neutral-500"
              >공고일, 접수 시작, 접수 마감일을 월간 일정으로 봅니다.</small
            >
          </RouterLink>
          <RouterLink
            class="feature-panel grid min-h-[260px] content-between border border-neutral-200 bg-white p-[26px] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(23,23,23,0.12)]"
            to="/transfers"
          >
            <span
              class="tag w-fit bg-[#f7f4ef] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]"
              >Transfer</span
            >
            <strong class="mt-10 block text-[26px] font-black leading-tight">양도 게시판</strong>
            <small class="block text-sm font-bold leading-6 text-neutral-500"
              >계약 기간이 남은 전월세 양도글을 확인합니다.</small
            >
          </RouterLink>
          <RouterLink
            class="feature-panel grid min-h-[260px] content-between border border-neutral-200 bg-white p-[26px] transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(23,23,23,0.12)]"
            to="/analysis"
          >
            <span
              class="tag w-fit bg-[#f7f4ef] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]"
              >Life Analysis</span
            >
            <strong class="mt-10 block text-[26px] font-black leading-tight">생활권 분석</strong>
            <small class="block text-sm font-bold leading-6 text-neutral-500"
              >상권과 교통 이벤트를 기준으로 후보지를 비교합니다.</small
            >
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

.home-story-section {
  color: #171717;
}

.home-story-visual {
  transform: translateY(24px) scale(0.98);
  opacity: 0;
  transition:
    opacity 0.9s ease 0.48s,
    transform 0.9s cubic-bezier(0.22, 1, 0.36, 1) 0.48s;
}

.fullpage-reveal.is-visible .home-story-visual {
  opacity: 1;
  transform: translateY(0) scale(1);
}

.home-product-shell,
.home-product-note {
  border-radius: 0;
}

.home-product-row {
  min-height: 64px;
}

:deep(.rental-swiper .swiper-wrapper) {
  align-items: stretch;
}

:deep(.rental-swiper .swiper-slide) {
  height: auto;
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

  .home-story-visual {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

@media (max-width: 1023px) {
  .home-story-section {
    min-height: auto;
    height: auto;
  }

  .home-story-grid {
    min-height: 100vh;
    align-content: center;
    padding-top: 112px;
    padding-bottom: 64px;
  }
}

@media (max-width: 680px) {
  .home-page {
    scroll-padding-top: 96px;
  }

  .home-story-grid {
    width: min(100% - 32px, 1480px);
    gap: 28px;
    padding-top: 132px;
  }

  .home-story-copy h2 {
    font-size: clamp(34px, 11vw, 46px);
    line-height: 1.05;
  }

  .home-story-copy p {
    font-size: 15px;
    line-height: 1.85;
  }

  .home-product-shell {
    padding: 16px;
  }

  .home-product-stat {
    font-size: clamp(48px, 18vw, 72px);
  }

  .home-product-row {
    min-height: 54px;
    padding: 12px 112px 12px 14px;
  }
}
</style>
