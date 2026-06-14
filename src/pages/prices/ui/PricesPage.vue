<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
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
const mapEl = ref(null)
const mapMessage = ref('')
let kakaoMap = null
let markerBounds = null
let kakaoSdkPromise = null
const markers = []
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
  const defaults = hasQuery ? { ...defaultPriceCondition, mode: 'search', sidoName: '', gugunName: '' } : defaultPriceCondition
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
    String(trade.aptSeq ?? '').startsWith('SAMPLE-') ||
    String(trade.aptName ?? '').includes('샘플') ||
    Number(trade.no) >= 900000
  )
}

async function loadTrades() {
  loading.value = true
  try {
    const { data } = await api.get('/houses', { params: toQuery(condition) })
    const realTrades = data.filter((trade) => !isSampleTrade(trade))
    trades.value = realTrades
    selectedTrade.value = realTrades[0] || null
  } finally {
    loading.value = false
  }
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

async function loadKakaoSdk() {
  if (window.kakao?.maps?.load) {
    return window.kakao
  }
  if (!kakaoSdkPromise) {
    kakaoSdkPromise = api.get('/config').then(({ data }) => {
      const appKey = data.kakaoJavascriptKey
      if (!appKey) {
        throw new Error('Kakao JavaScript key is empty')
      }
      return new Promise((resolve, reject) => {
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
    })
  }
  await kakaoSdkPromise
  await new Promise((resolve) => window.kakao.maps.load(resolve))
  return window.kakao
}

async function renderMap() {
  await nextTick()
  if (!mapEl.value) return
  try {
    const kakao = await loadKakaoSdk()
    const fallbackCenter = new kakao.maps.LatLng(37.5172, 127.0473)
    if (!kakaoMap) {
      kakaoMap = new kakao.maps.Map(mapEl.value, {
        center: fallbackCenter,
        level: 6,
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
      })
      markers.push(marker)
      markerBounds.extend(position)
    })
    if (visibleTrades.length) {
      kakaoMap.setBounds(markerBounds)
    } else {
      kakaoMap.setCenter(fallbackCenter)
    }
    mapMessage.value = ''
  } catch {
    mapMessage.value =
      'Kakao 지도를 불러오지 못했습니다. 백엔드 .env의 OPENAPI_KAKAO_JAVASCRIPT_KEY와 Kakao Web 플랫폼 도메인을 확인하세요.'
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
  const point = getLatLng(trade)
  if (point && kakaoMap && window.kakao?.maps) {
    kakaoMap.panTo(new window.kakao.maps.LatLng(point.latitude, point.longitude))
  }
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
  await loadRegions()
  await loadDependentRegions()
  await loadTrades()
  await renderMap()
})

onBeforeUnmount(() => {
  clearMarkers()
})

watch(trades, () => {
  renderMap()
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
          <RouterLink v-if="!memberStore.isLoggedIn" to="/login" class="text-white hover:text-white/70">
            로그인
          </RouterLink>
          <button v-else type="button" class="border-white/60 bg-white/10 text-white hover:bg-white/20" @click="logout">
            로그아웃
          </button>
        </nav>
      </div>
    </header>

    <main class="relative h-screen">
      <section id="map" class="absolute inset-0 bg-neutral-300">
        <div ref="mapEl" class="h-full w-full bg-[linear-gradient(135deg,#d6d6d6_0%,#ededed_42%,#c8c8c8_100%)]"></div>
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

      <div
        v-if="mapMessage"
        class="absolute right-6 top-28 z-30 max-w-sm border border-red-200 bg-white p-5 text-sm font-bold text-red-700 shadow-xl"
      >
        {{ mapMessage }}
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

