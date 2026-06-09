<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api, toQuery } from '@/shared/api/client'
import { useMemberStore } from '@/entities/member/model/member'

const route = useRoute()
const router = useRouter()
const memberStore = useMemberStore()
const loading = ref(false)
const trades = ref([])
const sidos = ref([])
const guguns = ref([])
const dongs = ref([])
const selectedTrade = ref(null)
const condition = reactive({
  mode: 'search',
  keyword: '',
  sidoName: '',
  gugunName: '',
  dongName: '',
  dealYear: '',
  limit: 20,
})

const statusText = computed(() => {
  if (loading.value) return '거래 정보를 불러오는 중입니다.'
  if (hasSearchCondition()) return `총 ${trades.value.length}건의 거래를 표시합니다.`
  return '지역이나 아파트명을 검색하면 DB 실거래 정보가 표시됩니다.'
})

function hasSearchCondition() {
  return Boolean(
    condition.keyword ||
      condition.sidoName ||
      condition.gugunName ||
      condition.dongName ||
      condition.dealYear,
  )
}

function syncFromRoute() {
  Object.assign(condition, {
    mode: route.query.mode || 'search',
    keyword: route.query.keyword || '',
    sidoName: route.query.sidoName || '',
    gugunName: route.query.gugunName || '',
    dongName: route.query.dongName || '',
    dealYear: route.query.dealYear || '',
    limit: route.query.limit || 20,
  })
}

async function loadRegions() {
  const { data } = await api.get('/regions/sidos')
  sidos.value = data
}

async function loadDependentRegions() {
  guguns.value = []
  dongs.value = []
  if (condition.sidoName) {
    const { data } = await api.get('/regions/guguns', { params: { sidoName: condition.sidoName } })
    guguns.value = data
  }
  if (condition.sidoName && condition.gugunName) {
    const { data } = await api.get('/regions/dongs', {
      params: { sidoName: condition.sidoName, gugunName: condition.gugunName },
    })
    dongs.value = data
  }
}

async function loadTrades() {
  loading.value = true
  try {
    const { data } = await api.get('/houses', { params: toQuery(condition) })
    trades.value = data
    selectedTrade.value = data[0] || null
  } finally {
    loading.value = false
  }
}

async function search() {
  condition.mode = 'search'
  await router.push({ path: '/prices', query: toQuery(condition) })
  await loadTrades()
}

async function onSidoChange() {
  condition.mode = 'region'
  condition.gugunName = ''
  condition.dongName = ''
  await loadDependentRegions()
  await search()
}

async function onGugunChange() {
  condition.mode = 'region'
  condition.dongName = ''
  await loadDependentRegions()
  await search()
}

function openDetail(trade) {
  selectedTrade.value = trade
}

onMounted(async () => {
  document.title = '실거래 지도 | SSAFY Home'
  if (!memberStore.loaded) {
    memberStore.fetchMe()
  }
  syncFromRoute()
  await loadRegions()
  await loadDependentRegions()
  await loadTrades()
})
</script>

<template>
  <div class="h-screen overflow-hidden bg-[#f4f0ea] text-[#171717]">
    <header
      class="absolute left-0 right-0 top-0 z-30 border-b border-white/15 bg-black/35 text-white backdrop-blur"
    >
      <div class="flex h-20 items-center justify-between px-6 lg:px-8">
        <RouterLink to="/home" class="flex items-center gap-3">
          <span
            class="grid h-10 w-16 place-items-center border border-white/70 text-[10px] font-black leading-none tracking-[0.12em] [text-indent:0.12em] whitespace-nowrap"
            >HOME</span
          >
          <strong class="text-sm font-black uppercase tracking-[0.22em]">SSAFY Home</strong>
        </RouterLink>
        <nav class="hidden items-center gap-7 text-sm font-black md:flex">
          <RouterLink to="/home" class="text-white hover:text-white/70">홈</RouterLink>
          <RouterLink to="/prices" class="text-white hover:text-white/70">부동산 시세</RouterLink>
          <RouterLink to="/rentals" class="text-white hover:text-white/70">공공임대</RouterLink>
          <RouterLink to="/analysis" class="text-white hover:text-white/70">생활권 분석</RouterLink>
          <RouterLink v-if="!memberStore.isLoggedIn" to="/login" class="text-white hover:text-white/70">
            로그인
          </RouterLink>
          <RouterLink v-if="!memberStore.isLoggedIn" to="/register" class="text-white hover:text-white/70">
            회원가입
          </RouterLink>
          <RouterLink v-if="memberStore.isLoggedIn" to="/member" class="text-white hover:text-white/70">
            마이페이지
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="relative h-screen">
      <section id="map" class="absolute inset-0 bg-neutral-300">
        <div class="h-full w-full bg-[linear-gradient(135deg,#d6d6d6_0%,#ededed_42%,#c8c8c8_100%)]"></div>
      </section>
      <div class="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent"></div>

      <aside
        class="absolute bottom-0 left-0 top-20 z-20 flex w-full max-w-[520px] flex-col bg-white/95 shadow-2xl backdrop-blur md:m-6 md:top-24 md:max-h-[calc(100vh-7.5rem)] md:border md:border-white/70"
      >
        <section class="border-b border-neutral-200 p-5">
          <p class="text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">Apartment Search</p>
          <h1 class="mt-2 text-3xl font-black leading-tight">실거래 지도</h1>
          <form class="mt-5 space-y-3" @submit.prevent="search">
            <input
              v-model="condition.keyword"
              class="h-12 w-full border-neutral-300 text-sm font-bold"
              placeholder="아파트명 또는 지역명을 입력하세요"
            />
            <div class="grid grid-cols-2 gap-2" style="grid-template-columns: repeat(2, minmax(0, 1fr))">
              <select
                v-model="condition.sidoName"
                class="h-11 border-neutral-300 text-sm font-bold"
                @change="onSidoChange"
              >
                <option value="">시도 전체</option>
                <option v-for="sido in sidos" :key="sido.value" :value="sido.value">{{ sido.label }}</option>
              </select>
              <select
                v-model="condition.gugunName"
                class="h-11 border-neutral-300 text-sm font-bold"
                @change="onGugunChange"
              >
                <option value="">구군 전체</option>
                <option v-for="gugun in guguns" :key="gugun.value" :value="gugun.value">{{ gugun.label }}</option>
              </select>
              <select v-model="condition.dongName" class="h-11 border-neutral-300 text-sm font-bold">
                <option value="">동 전체</option>
                <option v-for="dong in dongs" :key="dong.value" :value="dong.value">{{ dong.label }}</option>
              </select>
              <input
                v-model="condition.dealYear"
                type="number"
                class="h-11 border-neutral-300 text-sm font-bold"
                placeholder="거래연도"
              />
            </div>
            <div class="grid grid-cols-[1fr_auto] gap-2" style="grid-template-columns: 1fr auto">
              <input
                v-model="condition.limit"
                type="number"
                min="1"
                max="500"
                class="h-11 border-neutral-300 text-sm font-bold"
                placeholder="조회 개수"
              />
              <button class="flex h-11 items-center gap-2 bg-[#b4212a] px-5 text-sm font-black text-white">
                검색
                <span class="material-symbols-outlined text-base">search</span>
              </button>
            </div>
          </form>
          <p class="mt-4 text-xs font-bold text-neutral-500">{{ statusText }}</p>
        </section>

        <section class="flex-1 overflow-y-auto">
          <p v-if="loading" class="p-6 text-sm font-bold text-neutral-500">거래 정보를 불러오는 중입니다.</p>
          <p v-else-if="!trades.length && !hasSearchCondition()" class="p-6 text-sm font-bold text-neutral-500">
            검색 조건을 입력해 주세요.
          </p>
          <p v-else-if="!trades.length" class="p-6 text-sm font-bold text-neutral-500">
            조건과 일치하는 거래 정보가 없습니다.
          </p>
          <article
            v-for="trade in trades"
            :key="trade.no"
            class="trade-item relative cursor-pointer border-b border-neutral-200 p-5 transition hover:bg-[#f7f4ef]"
            @click="openDetail(trade)"
          >
            <RouterLink
              class="absolute right-5 top-5 border border-neutral-300 bg-white px-3 py-2 text-xs font-black text-[#171717] hover:text-[#b4212a]"
              :to="{
                path: '/analysis',
                query: {
                  label: trade.address,
                  longitude: trade.longitude || 126.9413,
                  latitude: trade.latitude || 37.4826,
                  radius: 1000,
                },
              }"
              @click.stop
            >
              생활권 분석
            </RouterLink>
            <div class="pr-28 text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]">APT SALE</div>
            <h2 class="mt-2 text-xl font-black leading-tight">{{ trade.aptName }}</h2>
            <div class="mt-4 text-sm">
              <strong class="text-lg text-[#b4212a]">{{ trade.dealAmount }}만원</strong>
              <p class="mt-2 font-bold text-neutral-700">
                {{ trade.exclusiveArea }}㎡ {{ trade.floor }}층 {{ trade.dealDate }}
              </p>
              <p class="mt-2 text-xs leading-5 text-neutral-500">{{ trade.address }}</p>
              <button
                type="button"
                class="mt-4 w-full border border-neutral-300 bg-white px-3 py-2 text-xs font-black text-[#b4212a]"
                @click.stop
              >
                관심매물 등록
              </button>
            </div>
          </article>
        </section>
      </aside>

      <aside class="map-side-nav">
        <RouterLink to="/rentals">공지사항</RouterLink>
        <RouterLink to="/prices">실거래 검색</RouterLink>
        <RouterLink to="/member">회원정보</RouterLink>
        <RouterLink to="/analysis">FAQ</RouterLink>
      </aside>

      <div
        class="absolute right-6 top-28 z-30 max-w-sm border border-red-200 bg-white p-5 text-sm font-bold text-red-700 shadow-xl"
      >
        Kakao 지도를 불러오지 못했습니다. Kakao JavaScript 키와 Web 플랫폼 등록 정보를 확인하세요.
      </div>

      <div
        v-if="selectedTrade"
        class="absolute right-6 top-28 z-30 hidden w-96 border border-neutral-200 bg-white/95 p-6 shadow-2xl backdrop-blur md:block"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <p class="text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]">APT SALE</p>
            <h2 class="mt-2 text-2xl font-black">{{ selectedTrade.aptName }}</h2>
          </div>
          <button
            class="grid h-8 w-8 place-items-center border border-neutral-300 text-xs font-black"
            @click="selectedTrade = null"
          >
            X
          </button>
        </div>
        <dl class="mt-6 space-y-4 text-sm">
          <div>
            <dt class="text-xs font-black text-neutral-500">주소</dt>
            <dd class="mt-1 font-bold text-neutral-900">{{ selectedTrade.address }}</dd>
          </div>
          <div>
            <dt class="text-xs font-black text-neutral-500">가격</dt>
            <dd class="mt-1 font-bold text-neutral-900">{{ selectedTrade.dealAmount }}만원</dd>
          </div>
          <div>
            <dt class="text-xs font-black text-neutral-500">면적/층</dt>
            <dd class="mt-1 font-bold text-neutral-900">
              {{ selectedTrade.exclusiveArea }}㎡ · {{ selectedTrade.floor }}층 · {{ selectedTrade.dealDate }}
            </dd>
          </div>
        </dl>
      </div>
    </main>
  </div>
</template>

