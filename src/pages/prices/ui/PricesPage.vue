<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api, toQuery } from '@/shared/api/client'
import { useMemberStore } from '@/entities/member/model/member'
import PropertyDetailPanel from '@/features/property-detail/ui/PropertyDetailPanel.vue'

const route = useRoute()
const router = useRouter()
const memberStore = useMemberStore()
const loading = ref(false)
const trades = ref([])
const sidos = ref([])
const guguns = ref([])
const dongs = ref([])
const selectedTrade = ref(null)
const selectedTab = ref('detail')
const mapEl = ref(null)
const mapMessage = ref('')
let kakaoMap = null
let markerBounds = null
let kakaoSdkPromise = null
let mapRenderSequence = 0
const markers = []
const defaultMapLevel = 6
const defaultPriceCondition = {
  mode: 'region',
  keyword: '',
  sidoName: '서울특별시',
  gugunName: '강남구',
  dongName: '',
  dealYear: '',
  limit: 20,
}
const condition = reactive({
  mode: defaultPriceCondition.mode,
  keyword: '',
  sidoName: defaultPriceCondition.sidoName,
  gugunName: defaultPriceCondition.gugunName,
  dongName: '',
  dealYear: '',
  limit: defaultPriceCondition.limit,
})

const statusText = computed(() => {
  if (loading.value) return '거래 정보를 불러오는 중입니다.'
  if (hasSearchCondition()) return `총 ${trades.value.length}건의 거래를 표시합니다.`
  return '지역이나 아파트명을 검색하면 DB 실거래 정보가 표시됩니다.'
})

const propertyLoginRoute = computed(() => {
  if (!selectedTrade.value) return '/login'
  const query = Object.entries(route.query)
    .filter(([key]) => key !== 'trade' && key !== 'tab')
    .flatMap(([key, value]) =>
      (Array.isArray(value) ? value : [value]).map((item) => `${key}=${item}`),
    )
  query.push(`trade=${selectedTrade.value.no}`, `tab=${selectedTab.value}`)
  return {
    path: '/login',
    query: {
      redirect: `/prices?${query.join('&')}`,
    },
  }
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
  const hasQuery = Object.keys(route.query).length > 0
  const defaults = hasQuery
    ? { ...defaultPriceCondition, mode: 'search', sidoName: '', gugunName: '' }
    : defaultPriceCondition
  Object.assign(condition, {
    mode: route.query.mode || defaults.mode,
    keyword: route.query.keyword || defaults.keyword,
    sidoName: route.query.sidoName || defaults.sidoName,
    gugunName: route.query.gugunName || defaults.gugunName,
    dongName: route.query.dongName || defaults.dongName,
    dealYear: route.query.dealYear || defaults.dealYear,
    limit: route.query.limit || defaults.limit,
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

function isSampleTrade(trade) {
  return (
    String(trade.aptSeq ?? '').startsWith('SAMPLE-') || String(trade.aptName ?? '').includes('샘플')
  )
}

function pickFirst(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

function composeAddress(trade) {
  return [
    pickFirst(trade.sidoName, trade.sido_name),
    pickFirst(trade.gugunName, trade.gugun_name),
    pickFirst(trade.dongName, trade.dong_name, trade.umdName, trade.umd_nm),
    pickFirst(trade.jibun),
  ]
    .filter(Boolean)
    .join(' ')
}

function composeDealDate(trade) {
  const dealYear = pickFirst(trade.dealYear, trade.deal_year)
  const dealMonth = pickFirst(trade.dealMonth, trade.deal_month)
  const dealDay = pickFirst(trade.dealDay, trade.deal_day)
  if (!dealYear || !dealMonth || !dealDay) return ''
  return `${dealYear}-${String(dealMonth).padStart(2, '0')}-${String(dealDay).padStart(2, '0')}`
}

function normalizeTrade(trade) {
  return {
    ...trade,
    no: pickFirst(trade.no, trade.dealNo, trade.deal_no),
    aptSeq: pickFirst(trade.aptSeq, trade.apt_seq),
    aptName: pickFirst(trade.aptName, trade.apt_nm, trade.apt_name),
    sidoName: pickFirst(trade.sidoName, trade.sido_name),
    gugunName: pickFirst(trade.gugunName, trade.gugun_name),
    dongName: pickFirst(trade.dongName, trade.dong_name, trade.umdName, trade.umd_nm),
    address: pickFirst(trade.address, composeAddress(trade)),
    latitude: pickFirst(trade.latitude, trade.lat),
    longitude: pickFirst(trade.longitude, trade.lng, trade.lon),
    exclusiveArea: pickFirst(trade.exclusiveArea, trade.exclu_use_ar, trade.exclusive_area),
    dealAmount: pickFirst(trade.dealAmount, trade.deal_amount),
    dealDate: pickFirst(trade.dealDate, trade.deal_date, composeDealDate(trade)),
    floor: pickFirst(trade.floor),
  }
}

async function loadTrades() {
  loading.value = true
  try {
    const { data } = await api.get('/houses', { params: toQuery(condition) })
    const realTrades = data.map(normalizeTrade).filter((trade) => !isSampleTrade(trade))
    trades.value = realTrades
    selectedTrade.value = null
    restorePropertyContext()
  } finally {
    loading.value = false
  }
}

function restorePropertyContext() {
  const tradeNo = route.query.trade
  if (tradeNo === undefined) return
  const matchingTrade = trades.value.find((trade) => String(trade.no) === String(tradeNo))
  if (!matchingTrade) return
  selectedTrade.value = matchingTrade
  selectedTab.value = ['detail', 'loan'].includes(route.query.tab) ? route.query.tab : 'detail'
}

function clearMarkers() {
  while (markers.length) {
    markers.pop().setMap(null)
  }
}

function getLatLng(trade) {
  const latitude = Number(trade.latitude)
  const longitude = Number(trade.longitude)
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }
  return { latitude, longitude }
}

function focusMap(point, level = 3) {
  if (!point || !kakaoMap || !window.kakao?.maps) return
  const position = new window.kakao.maps.LatLng(point.latitude, point.longitude)
  kakaoMap.setLevel(level)
  kakaoMap.panTo(position)
}

function shouldFocusSearchResult() {
  return Boolean(condition.mode === 'search' || condition.keyword || condition.dongName)
}

async function loadKakaoSdk() {
  if (window.kakao?.maps?.load) {
    return window.kakao
  }
  if (!kakaoSdkPromise) {
    kakaoSdkPromise = new Promise((resolve, reject) => {
      const appKey = import.meta.env.OPENAPI_KAKAO_JAVASCRIPT_KEY
      if (!appKey) {
        reject(new Error('Kakao JavaScript key is empty'))
        return
      }
      const existing = document.getElementById('kakao-map-sdk')
      if (existing) {
        existing.addEventListener('load', resolve, { once: true })
        existing.addEventListener('error', reject, { once: true })
        return
      }
      const script = document.createElement('script')
      script.id = 'kakao-map-sdk'
      script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&libraries=services&autoload=false`
      script.async = true
      script.onload = resolve
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  await kakaoSdkPromise
  await new Promise((resolve) => window.kakao.maps.load(resolve))
  return window.kakao
}

async function renderMap() {
  const renderSequence = ++mapRenderSequence
  await nextTick()
  if (!mapEl.value) return
  try {
    const kakao = await loadKakaoSdk()
    if (renderSequence !== mapRenderSequence) return
    const fallbackCenter = new kakao.maps.LatLng(37.5172, 127.0473)
    if (!kakaoMap) {
      kakaoMap = new kakao.maps.Map(mapEl.value, {
        center: fallbackCenter,
        level: defaultMapLevel,
      })
    }
    clearMarkers()
    markerBounds = new kakao.maps.LatLngBounds()
    const visibleTrades = trades.value.filter(getLatLng)
    visibleTrades.forEach((trade) => {
      const point = getLatLng(trade)
      const position = new kakao.maps.LatLng(point.latitude, point.longitude)
      const marker = new kakao.maps.Marker({
        map: kakaoMap,
        position,
        title: trade.aptName,
      })
      kakao.maps.event.addListener(marker, 'click', () => {
        selectedTrade.value = trade
        selectedTab.value = 'detail'
        focusMap(point, 3)
      })
      markers.push(marker)
      markerBounds.extend(position)
    })
    const selectedPoint = selectedTrade.value ? getLatLng(selectedTrade.value) : null
    const firstSearchPoint = visibleTrades.length ? getLatLng(visibleTrades[0]) : null
    if (selectedPoint) {
      focusMap(selectedPoint, 3)
    } else if (shouldFocusSearchResult() && firstSearchPoint) {
      focusMap(firstSearchPoint, 4)
    } else if (visibleTrades.length) {
      kakaoMap.setLevel(defaultMapLevel)
    } else {
      kakaoMap.setCenter(fallbackCenter)
      kakaoMap.setLevel(defaultMapLevel)
    }
    mapMessage.value = ''
  } catch {
    mapMessage.value =
      'Kakao 지도를 불러오지 못했습니다. 프론트 .env의 OPENAPI_KAKAO_JAVASCRIPT_KEY와 Kakao Web 플랫폼 도메인을 확인하세요.'
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
  selectedTab.value = 'detail'
  focusMap(getLatLng(trade), 3)
}

async function logout() {
  await memberStore.logout()
  await router.push('/home')
}

onMounted(async () => {
  document.title = '실거래 지도 | SSAFY Home'
  if (!memberStore.loaded) {
    memberStore.fetchMe()
  }
  syncFromRoute()
  await Promise.allSettled([renderMap(), loadRegions(), loadDependentRegions(), loadTrades()])
})

onBeforeUnmount(() => {
  clearMarkers()
})

watch(trades, () => {
  renderMap()
}, { flush: 'post' })
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
          <RouterLink
            v-if="!memberStore.isLoggedIn"
            to="/login"
            class="text-white hover:text-white/70"
          >
            로그인
          </RouterLink>
          <button
            v-else
            type="button"
            class="border-white/60 bg-white/10 text-white hover:bg-white/20"
            @click="logout"
          >
            로그아웃
          </button>
        </nav>
      </div>
    </header>

    <main class="price-map-shell relative h-screen">
      <section id="map" class="absolute inset-0 bg-neutral-300">
        <div
          ref="mapEl"
          class="h-full w-full bg-[linear-gradient(135deg,#d6d6d6_0%,#ededed_42%,#c8c8c8_100%)]"
        ></div>
      </section>
      <div
        class="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/70 via-black/20 to-transparent"
      ></div>

      <aside
        class="price-search-panel absolute bottom-0 left-0 top-20 z-20 flex w-full flex-col bg-white/95 shadow-2xl backdrop-blur md:border md:border-white/70"
      >
        <section class="border-b border-neutral-200 p-5">
          <p class="text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
            Apartment Search
          </p>
          <h1 class="mt-2 text-3xl font-black leading-tight">실거래 지도</h1>
          <form class="mt-5 space-y-3" @submit.prevent="search">
            <input
              v-model="condition.keyword"
              class="h-12 w-full border-neutral-300 text-sm font-bold"
              placeholder="아파트명 또는 지역명을 입력하세요"
            />
            <div class="grid !grid-cols-2 gap-2">
              <select
                v-model="condition.sidoName"
                class="h-11 border-neutral-300 text-sm font-bold"
                @change="onSidoChange"
              >
                <option value="">시도 전체</option>
                <option v-for="sido in sidos" :key="sido.value" :value="sido.value">
                  {{ sido.label }}
                </option>
              </select>
              <select
                v-model="condition.gugunName"
                class="h-11 border-neutral-300 text-sm font-bold"
                @change="onGugunChange"
              >
                <option value="">구군 전체</option>
                <option v-for="gugun in guguns" :key="gugun.value" :value="gugun.value">
                  {{ gugun.label }}
                </option>
              </select>
              <select
                v-model="condition.dongName"
                class="h-11 border-neutral-300 text-sm font-bold"
              >
                <option value="">동 전체</option>
                <option v-for="dong in dongs" :key="dong.value" :value="dong.value">
                  {{ dong.label }}
                </option>
              </select>
              <input
                v-model="condition.dealYear"
                type="number"
                class="h-11 border-neutral-300 text-sm font-bold"
                placeholder="거래연도"
              />
            </div>
            <div class="grid !grid-cols-[1fr_auto] gap-2">
              <input
                v-model="condition.limit"
                type="number"
                min="1"
                max="500"
                class="h-11 border-neutral-300 text-sm font-bold"
                placeholder="조회 개수"
              />
              <button
                class="flex h-11 items-center gap-2 bg-[#b4212a] px-5 text-sm font-black text-white"
              >
                검색
                <span class="material-symbols-outlined text-base">search</span>
              </button>
            </div>
          </form>
          <p class="mt-4 text-xs font-bold text-neutral-500">{{ statusText }}</p>
        </section>

        <section class="flex-1 overflow-y-auto">
          <p v-if="loading" class="p-6 text-sm font-bold text-neutral-500">
            거래 정보를 불러오는 중입니다.
          </p>
          <p
            v-else-if="!trades.length && !hasSearchCondition()"
            class="p-6 text-sm font-bold text-neutral-500"
          >
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
            <div class="pr-28 text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]">
              APT SALE
            </div>
            <h2 class="mt-2 text-xl font-black leading-tight">{{ trade.aptName }}</h2>
            <div class="mt-4 text-sm">
              <strong class="text-lg text-[#b4212a]">{{ trade.dealAmount }}만원</strong>
              <p class="mt-2 font-bold text-neutral-700">
                {{ trade.exclusiveArea }}㎡ {{ trade.floor }}층 {{ trade.dealDate }}
              </p>
              <p class="mt-2 text-xs leading-5 text-neutral-500">{{ trade.address }}</p>
              <button
                type="button"
                :data-testid="`open-detail-${trade.no}`"
                class="mt-4 w-full border border-neutral-300 bg-white px-3 py-2 text-xs font-black text-[#b4212a]"
                @click.stop="openDetail(trade)"
              >
                상세보기
              </button>
            </div>
          </article>
        </section>
      </aside>

      <div
        v-if="mapMessage"
        class="absolute right-6 top-28 z-30 max-w-sm border border-red-200 bg-white p-5 text-sm font-bold text-red-700 shadow-xl"
      >
        {{ mapMessage }}
      </div>

      <PropertyDetailPanel
        v-if="selectedTrade"
        :trade="selectedTrade"
        :logged-in="memberStore.isLoggedIn"
        :initial-tab="selectedTab"
        :login-route="propertyLoginRoute"
        @tab-change="selectedTab = $event"
        @close="selectedTrade = null"
      />
    </main>
  </div>
</template>

<style scoped>
.price-map-shell {
  --price-panel-left: 1.5rem;
  --price-panel-top: 6rem;
  --price-panel-bottom: 1.5rem;
  --price-panel-gap: 0px;
  --price-panel-width: min(520px, calc((100vw - (var(--price-panel-left) * 2)) / 2));
}

.price-search-panel {
  box-sizing: border-box;
  max-width: var(--price-panel-width);
}

@media (min-width: 768px) {
  .price-search-panel {
    top: var(--price-panel-top);
    bottom: var(--price-panel-bottom);
    left: var(--price-panel-left);
    width: var(--price-panel-width);
    max-width: none;
    max-height: calc(100vh - 7.5rem);
  }
}
</style>
