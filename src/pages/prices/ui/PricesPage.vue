<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toQuery } from '@/shared/api/client'
import { useMemberStore } from '@/entities/member/model/member'
import { memberQueryOptions } from '@/entities/member/model/memberQueries'
import PropertyDetailPanel from '@/features/property-detail/ui/PropertyDetailPanel.vue'
import { appQueryOptions } from '@/shared/query/appQueries'
import {
  getDealTypeLabel,
  getHouseTradeLabel,
  getHouseTradePriceLabel,
} from '@/entities/house/model/houseTradeLabels'

const route = useRoute()
const router = useRouter()
const memberStore = useMemberStore()
const selectedTrade = ref(null)
const selectedTab = ref('detail')
const activePropertyTab = ref('apartment')
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
const submittedCondition = ref({ ...condition })
const sidosQuery = useQuery(appQueryOptions.sidos())
const gugunsQuery = useQuery(computed(() => appQueryOptions.guguns(condition.sidoName)))
const dongsQuery = useQuery(
  computed(() => appQueryOptions.dongs(condition.sidoName, condition.gugunName)),
)
const apartmentTradesQuery = useQuery(
  computed(() => appQueryOptions.houseList(toPropertyQuery('APARTMENT'))),
)
const officetelTradesQuery = useQuery(
  computed(() => appQueryOptions.houseList(toPropertyQuery('OFFICETEL'))),
)
const oneroomTradesQuery = useQuery(
  computed(() => appQueryOptions.houseList(toPropertyQuery('ONEROOM'))),
)
const dealFavoritesQuery = useQuery({
  ...memberQueryOptions.dealFavorites(),
  enabled: () => memberStore.isLoggedIn && activePropertyTab.value === 'favorites',
})
const loading = computed(
  () =>
    apartmentTradesQuery.isPending.value ||
    officetelTradesQuery.isPending.value ||
    oneroomTradesQuery.isPending.value,
)
const tabLoading = computed(
  () =>
    activePropertyQuery.value.isPending.value ||
    (activePropertyTab.value === 'favorites' && dealFavoritesQuery.isPending.value),
)
const apartmentTrades = computed(() =>
  normalizeTrades(apartmentTradesQuery.data.value, 'APARTMENT'),
)
const officetelTrades = computed(() =>
  normalizeTrades(officetelTradesQuery.data.value, 'OFFICETEL'),
)
const oneroomTrades = computed(() => normalizeTrades(oneroomTradesQuery.data.value, 'ONEROOM'))
const allTrades = computed(() => [
  ...apartmentTrades.value,
  ...officetelTrades.value,
  ...oneroomTrades.value,
])
const activePropertyQuery = computed(() => {
  if (activePropertyTab.value === 'officetel') return officetelTradesQuery
  if (activePropertyTab.value === 'oneroom') return oneroomTradesQuery
  return apartmentTradesQuery
})
const activePropertyTrades = computed(() => {
  if (activePropertyTab.value === 'officetel') return officetelTrades.value
  if (activePropertyTab.value === 'oneroom') return oneroomTrades.value
  return apartmentTrades.value
})
const trades = computed(() =>
  activePropertyTrades.value.map((trade) => ({
    ...trade,
    favorite: Boolean(trade.favorite || favoriteDealNos.value.has(String(trade.no))),
  })),
)
const favoriteTrades = computed(() =>
  (dealFavoritesQuery.data.value ?? [])
    .map((trade) => ({ ...normalizeTrade(trade), favorite: true }))
    .filter((trade) => !isSampleTrade(trade)),
)
const favoriteDealNos = computed(
  () => new Set(favoriteTrades.value.map((trade) => String(trade.no))),
)
const visibleTrades = computed(() => {
  if (activePropertyTab.value === 'favorites') return favoriteTrades.value
  return trades.value
})
const sidos = computed(() => sidosQuery.data.value ?? [])
const guguns = computed(() => gugunsQuery.data.value ?? [])
const dongs = computed(() => dongsQuery.data.value ?? [])
const propertyTabs = computed(() => [
  { key: 'apartment', label: '아파트', count: apartmentTrades.value.length },
  { key: 'officetel', label: '오피스텔', count: officetelTrades.value.length },
  { key: 'oneroom', label: '원룸', count: oneroomTrades.value.length },
  {
    key: 'favorites',
    label: '관심',
    count: memberStore.isLoggedIn ? favoriteTrades.value.length : 0,
  },
])

const statusText = computed(() => {
  if (tabLoading.value) return '거래 정보를 불러오는 중입니다.'
  if (activePropertyTab.value === 'favorites' && !memberStore.isLoggedIn) {
    return '로그인 후 관심 매물을 확인할 수 있습니다.'
  }
  if (hasSearchCondition()) return `총 ${visibleTrades.value.length}건의 거래를 표시합니다.`
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

function toPropertyQuery(propertyType) {
  const query = toQuery(submittedCondition.value)
  if (isDefaultRegionCondition(query) && propertyType !== 'APARTMENT') {
    delete query.sidoName
    delete query.gugunName
    delete query.dongName
    delete query.lawdCd
  }
  return {
    ...query,
    propertyType,
  }
}

function isDefaultRegionCondition(query) {
  return (
    !query.keyword &&
    !query.dongName &&
    !query.dealYear &&
    query.sidoName === defaultPriceCondition.sidoName &&
    query.gugunName === defaultPriceCondition.gugunName
  )
}

function normalizeTrades(items = [], fallbackPropertyType = '') {
  return items
    .map((trade) =>
      normalizeTrade({ ...trade, propertyType: trade.propertyType || fallbackPropertyType }),
    )
    .filter((trade) => !isSampleTrade(trade))
}

async function selectPropertyTab(tabKey) {
  if (tabKey === 'favorites' && !memberStore.isLoggedIn) {
    await router.push({ path: '/login', query: { redirect: route.fullPath } })
    return
  }
  activePropertyTab.value = tabKey
  selectedTrade.value = null
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
    no: pickFirst(
      trade.no,
      trade.dealNo,
      trade.deal_no,
      trade.propertyDealId,
      trade.property_deal_id,
    ),
    aptSeq: pickFirst(trade.aptSeq, trade.apt_seq, trade.sourceId, trade.source_id),
    aptName: pickFirst(
      trade.aptName,
      trade.apt_nm,
      trade.apt_name,
      trade.propertyName,
      trade.property_name,
    ),
    sidoName: pickFirst(trade.sidoName, trade.sido_name),
    gugunName: pickFirst(trade.gugunName, trade.gugun_name),
    dongName: pickFirst(trade.dongName, trade.dong_name, trade.umdName, trade.umd_nm),
    address: pickFirst(trade.address, composeAddress(trade)),
    latitude: pickFirst(trade.latitude, trade.lat),
    longitude: pickFirst(trade.longitude, trade.lng, trade.lon),
    exclusiveArea: pickFirst(trade.exclusiveArea, trade.exclu_use_ar, trade.exclusive_area),
    dealAmount: pickFirst(trade.dealAmount, trade.deal_amount),
    depositAmount: pickFirst(trade.depositAmount, trade.deposit_amount, trade.deposit),
    monthlyRentAmount: pickFirst(
      trade.monthlyRentAmount,
      trade.monthly_rent_amount,
      trade.monthlyRent,
    ),
    propertyType: pickFirst(
      trade.propertyType,
      trade.property_type,
      trade.houseType,
      trade.house_type,
      trade.buildingType,
      trade.building_type,
      trade.estateType,
      trade.estate_type,
      trade.realEstateType,
      trade.real_estate_type,
    ),
    dealType: pickFirst(
      trade.dealType,
      trade.deal_type,
      trade.tradeType,
      trade.trade_type,
      trade.rentType,
      trade.rent_type,
      trade.transactionType,
      trade.transaction_type,
    ),
    dealDate: pickFirst(trade.dealDate, trade.deal_date, composeDealDate(trade)),
    floor: pickFirst(trade.floor),
    jibun: pickFirst(trade.jibun),
  }
}

function tradeLabel(trade) {
  return getHouseTradeLabel(trade)
}

function tradePriceLabel(trade) {
  return getHouseTradePriceLabel(trade)
}

function formatShortManwon(value) {
  const amount = Number(String(value ?? '').replace(/[^0-9.-]/g, ''))
  if (!Number.isFinite(amount) || amount <= 0) return '-'
  if (amount >= 10000) {
    const eok = amount / 10000
    return `${Number.isInteger(eok) ? eok.toFixed(0) : eok.toFixed(1)}억`
  }
  return `${amount.toLocaleString()}만`
}

function markerTopLabel(trade) {
  const area = Number(trade.exclusiveArea)
  if (Number.isFinite(area) && area > 0) return `${Math.round(area * 0.3025)}평`
  return tradeLabel(trade).split(' / ')[0]
}

function markerPriceLabel(trade) {
  const dealType = getDealTypeLabel(trade)
  const prefix = dealType === '전세' ? '전' : dealType === '월세' ? '월' : '매'
  const price =
    dealType === '월세'
      ? trade.monthlyRentAmount || trade.dealAmount
      : trade.dealAmount || trade.depositAmount
  return `${prefix}${formatShortManwon(price)}`
}

function refreshMarkerSelection() {
  markers.forEach(({ element, trade }) => {
    element.classList.toggle('is-active', String(trade.no) === String(selectedTrade.value?.no))
  })
}

function createPriceMarkerContent(trade) {
  const element = document.createElement('button')
  element.type = 'button'
  element.className = 'price-map-marker'
  element.setAttribute('aria-label', `${trade.aptName} ${markerPriceLabel(trade)}`)
  element.innerHTML = `
    <span class="price-map-marker__area">${markerTopLabel(trade)}</span>
    <span class="price-map-marker__price">${markerPriceLabel(trade)}</span>
  `
  element.addEventListener('click', () => {
    selectedTrade.value = trade
    selectedTab.value = 'detail'
    refreshMarkerSelection()
    focusMap(getLatLng(trade), 3)
  })
  return element
}

async function loadTrades() {
  submittedCondition.value = { ...condition }
  selectedTrade.value = null
  await Promise.all([
    apartmentTradesQuery.refetch(),
    officetelTradesQuery.refetch(),
    oneroomTradesQuery.refetch(),
  ])
  restorePropertyContext()
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
    markers.pop().overlay.setMap(null)
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
    const mapTrades = visibleTrades.value.filter(getLatLng)
    mapTrades.forEach((trade) => {
      const point = getLatLng(trade)
      const position = new kakao.maps.LatLng(point.latitude, point.longitude)
      const content = createPriceMarkerContent(trade)
      const overlay = new kakao.maps.CustomOverlay({
        map: kakaoMap,
        position,
        content,
        xAnchor: 0.5,
        yAnchor: 1.15,
      })
      markers.push({ overlay, element: content, trade })
      markerBounds.extend(position)
    })
    refreshMarkerSelection()
    const selectedPoint = selectedTrade.value ? getLatLng(selectedTrade.value) : null
    const firstSearchPoint = mapTrades.length ? getLatLng(mapTrades[0]) : null
    if (selectedPoint) {
      focusMap(selectedPoint, 3)
    } else if (shouldFocusSearchResult() && firstSearchPoint) {
      focusMap(firstSearchPoint, 4)
    } else if (mapTrades.length) {
      kakaoMap.setLevel(defaultMapLevel)
    } else {
      kakaoMap.setCenter(fallbackCenter)
      kakaoMap.setLevel(defaultMapLevel)
    }
    mapMessage.value = ''
  } catch {
    mapMessage.value =
      'Kakao 지도를 불러오지 못했습니다. .env의 OPENAPI_KAKAO_JAVASCRIPT_KEY와 Kakao Web 플랫폼 도메인을 확인하세요.'
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
  await search()
}

async function onGugunChange() {
  condition.mode = 'region'
  condition.dongName = ''
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
  document.title = '실거래 지도 | HOME FIT'
  if (!memberStore.loaded) {
    memberStore.fetchMe()
  }
  syncFromRoute()
  await Promise.allSettled([renderMap(), loadTrades()])
})

onBeforeUnmount(() => {
  clearMarkers()
})

watch(
  visibleTrades,
  () => {
    restorePropertyContext()
    renderMap()
  },
  { flush: 'post' },
)
</script>

<template>
  <div class="min-h-screen bg-[#f4f0ea] text-[#171717] md:h-screen md:overflow-hidden">
    <header
      class="absolute left-0 right-0 top-0 z-30 border-b border-white/15 bg-black/35 text-white backdrop-blur"
    >
      <div class="flex h-20 items-center justify-between px-6 lg:px-8">
        <RouterLink to="/home" class="flex items-center gap-3">
          <span
            class="grid h-10 w-16 place-items-center border border-white/70 text-[10px] font-black leading-none tracking-[0.12em] [text-indent:0.12em] whitespace-nowrap"
            >HOME</span
          >
          <strong class="text-sm font-black uppercase tracking-[0.22em]">HOME FIT</strong>
        </RouterLink>
        <nav class="hidden items-center gap-7 text-sm font-black md:flex">
          <RouterLink
            v-if="!memberStore.isLoggedIn"
            to="/login"
            class="text-white hover:text-white/70"
          >
            로그인
          </RouterLink>
          <RouterLink
            v-if="memberStore.isLoggedIn"
            to="/member"
            class="text-white hover:text-white/70"
          >
            나의 정보
          </RouterLink>
          <button
            v-if="memberStore.isLoggedIn"
            type="button"
            class="border-white/60 bg-white/10 text-white hover:bg-white/20"
            @click="logout"
          >
            로그아웃
          </button>
        </nav>
      </div>
    </header>

    <main class="price-map-shell relative min-h-screen pt-20 md:h-screen md:pt-0">
      <section id="map" class="relative h-[320px] bg-neutral-300 md:absolute md:inset-0 md:h-auto">
        <div
          ref="mapEl"
          class="h-full w-full bg-[linear-gradient(135deg,#d6d6d6_0%,#ededed_42%,#c8c8c8_100%)]"
        ></div>
      </section>
      <div
        class="pointer-events-none absolute inset-0 hidden bg-gradient-to-r from-black/70 via-black/20 to-transparent md:block"
      ></div>

      <aside
        class="price-search-panel price-panel-frame relative z-20 flex w-full flex-col bg-white/95 shadow-2xl backdrop-blur md:absolute md:bottom-0 md:left-0 md:top-20 md:border md:border-white/70"
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
            <div class="grid grid-cols-1 gap-2 sm:!grid-cols-2">
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
            <div class="grid grid-cols-1 gap-2 sm:!grid-cols-[1fr_auto]">
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
                검색 <span class="material-symbols-outlined text-base">search</span>
              </button>
            </div>
          </form>
          <p class="mt-4 text-xs font-bold text-neutral-500">{{ statusText }}</p>
          <div class="mt-4 grid grid-cols-4 gap-2" aria-label="매물 유형">
            <button
              v-for="tab in propertyTabs"
              :key="tab.key"
              type="button"
              :data-testid="`property-tab-${tab.key}`"
              class="property-type-tab grid min-h-[58px] place-items-center gap-1 border border-neutral-200 bg-white px-2 py-2 text-xs font-black text-neutral-600 transition hover:border-[#b4212a] hover:text-[#b4212a]"
              :class="
                activePropertyTab === tab.key ? 'border-[#b4212a] bg-[#fff1f2] text-[#b4212a]' : ''
              "
              @click="selectPropertyTab(tab.key)"
            >
              <span>{{ tab.label }}</span>
              <small class="text-[11px] font-black opacity-70">{{ tab.count }}</small>
            </button>
          </div>
        </section>

        <section class="max-h-[56vh] overflow-y-auto md:max-h-none md:flex-1">
          <p v-if="tabLoading" class="p-6 text-sm font-bold text-neutral-500">
            거래 정보를 불러오는 중입니다.
          </p>
          <p
            v-else-if="activePropertyTab === 'favorites' && !memberStore.isLoggedIn"
            class="p-6 text-sm font-bold text-neutral-500"
          >
            로그인 후 관심 매물을 확인할 수 있습니다.
          </p>
          <p
            v-else-if="!visibleTrades.length && !hasSearchCondition()"
            class="p-6 text-sm font-bold text-neutral-500"
          >
            검색 조건을 입력해 주세요.
          </p>
          <p v-else-if="!visibleTrades.length" class="p-6 text-sm font-bold text-neutral-500">
            선택한 탭에 표시할 거래 정보가 없습니다.
          </p>
          <article
            v-for="trade in visibleTrades"
            :key="trade.no"
            class="trade-item relative cursor-pointer border-b border-neutral-200 p-5 transition hover:bg-[#f7f4ef]"
            @click="openDetail(trade)"
          >
            <RouterLink
              class="static mb-3 inline-flex min-h-9 items-center justify-center border border-neutral-300 bg-white px-3 py-2 text-xs font-black text-[#171717] hover:text-[#b4212a] sm:absolute sm:right-5 sm:top-5 sm:mb-0"
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
            <div class="text-xs font-black uppercase tracking-[0.18em] text-[#b4212a] sm:pr-28">
              {{ tradeLabel(trade) }}
            </div>
            <h2 class="mt-2 text-xl font-black leading-tight">{{ trade.aptName }}</h2>
            <div class="mt-4 text-sm">
              <strong class="text-lg text-[#b4212a]">{{ tradePriceLabel(trade) }}</strong>
              <p class="mt-2 font-bold text-neutral-700">
                {{ trade.exclusiveArea }}㎡ · {{ trade.floor }}층 · {{ trade.dealDate }}
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
        class="mx-4 mt-4 border border-red-200 bg-white p-5 text-sm font-bold text-red-700 shadow-xl md:absolute md:right-6 md:top-28 md:z-30 md:mx-0 md:mt-0 md:max-w-sm"
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
:global(.price-map-marker) {
  position: relative;
  display: inline-grid;
  grid-template-rows: 20px 28px;
  grid-template-columns: max-content;

  min-width: 68px;
  width: max-content;
  height: 48px;

  overflow: visible;
  border: 1px solid #676b73;
  border-radius: 7px;
  appearance: none;
  background: #ffffff;
  box-sizing: border-box;
  box-shadow: 0 2px 6px rgb(23 23 23 / 28%);
  color: #171717;
  cursor: pointer;
  font-family: inherit;
  line-height: 1;
  padding: 0;
  text-align: center;
  transform: translateY(-2px);
}

:global(.price-map-marker::after) {
  position: absolute;
  z-index: 0;
  bottom: -6px;
  left: 50%;

  width: 10px;
  height: 10px;

  border-right: 1px solid #676b73;
  border-bottom: 1px solid #676b73;
  border-radius: 0 0 2px 0;
  background: #ffffff;
  content: '';
  transform: translateX(-50%) rotate(45deg);
}

:global(.price-map-marker__area) {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  min-width: 68px;
  height: 20px;

  overflow: hidden;
  border-radius: 6px 6px 0 0;
  background: #757a83;
  box-sizing: border-box;
  color: #ffffff;
  font-size: 11px;
  font-weight: 900;
  line-height: 20px;
  padding: 0 8px;
  white-space: nowrap;
}

:global(.price-map-marker__price) {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  min-width: 68px;
  height: 28px;

  overflow: hidden;
  border-radius: 0 0 6px 6px;
  background: #ffffff;
  box-sizing: border-box;
  color: #171717;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: -0.02em;
  line-height: 28px;
  padding: 0 8px;
  white-space: nowrap;
}
:global(.price-map-marker:focus),
:global(.price-map-marker:focus-visible),
:global(.price-map-marker.is-active) {
  border-color: #2563eb;
  outline: none;
  z-index: 2;
}

:global(.price-map-marker:focus::after),
:global(.price-map-marker:focus-visible::after),
:global(.price-map-marker.is-active::after) {
  border-color: #2563eb;
}

:global(.price-map-marker:focus .price-map-marker__area),
:global(.price-map-marker:focus-visible .price-map-marker__area),
:global(.price-map-marker.is-active .price-map-marker__area) {
  background: #2563eb;
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
