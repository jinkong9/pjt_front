<script setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { toggleFavoriteRentalNotice } from '@/entities/rental/api/rentalApi'
import { rentalKeys, rentalQueryOptions } from '@/entities/rental/model/rentalQueries'
import {
  evaluateRentalEligibility,
  readStoredMyDataProfile,
  validateMyDataProfile,
} from '@/entities/mydata/model/myDataProfile'
import EmptyState from '@/shared/ui/EmptyState.vue'
import LoadingState from '@/shared/ui/LoadingState.vue'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const error = ref('')
const favorite = ref(false)
const favoriteLoading = ref(false)
const myDataProfile = ref(readStoredMyDataProfile())
const selectedSupply = ref(null)
const mapEl = ref(null)
const mapMessage = ref('')
let kakaoSdkPromise = null
let kakaoMap = null
let kakaoMarker = null
let kakaoInfoWindow = null
const noticeId = computed(() => route.params.noticeId)
const detailQuery = useQuery(computed(() => rentalQueryOptions.detail(noticeId.value)))
const detail = computed(() => detailQuery.data.value)
const loading = computed(() => detailQuery.isPending.value)
const favoriteMutation = useMutation({
  mutationFn: (id) => toggleFavoriteRentalNotice(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: rentalKeys.favorites() })
    queryClient.invalidateQueries({ queryKey: rentalKeys.detail(noticeId.value) })
    queryClient.invalidateQueries({ queryKey: rentalKeys.all })
  },
})

function mapError(code, message) {
  const error = new Error(message)
  error.code = code
  return error
}

const myDataErrors = computed(() => validateMyDataProfile(myDataProfile.value))
const hasMyData = computed(() => !Object.keys(myDataErrors.value).length)
const eligibility = computed(() =>
  hasMyData.value && detail.value ? evaluateRentalEligibility(myDataProfile.value, detail.value) : null,
)
const supplyRows = computed(() => detail.value?.supplies ?? [])
const mapTarget = computed(() => selectedSupply.value ?? supplyRows.value[0] ?? null)
const contractMapLabel = computed(() => {
  const contractAddress = detail.value?.detail?.contractDetailAddress
  if (contractAddress && contractAddress !== '-') return contractAddress
  return detail.value?.detail?.contractAddress || '-'
})

function value(value) {
  return value || '-'
}

function supplyMapAddress(supply) {
  return [supply?.mapAddress, supply?.address, supply?.lotNumber]
    .filter((item) => item && item !== '-')
    .join(' ')
}

function selectSupplyOnMap(supply) {
  selectedSupply.value = supply
  renderMap()
  nextTick(() => mapEl.value?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
}

async function loadKakaoSdk() {
  if (window.kakao?.maps?.load) return window.kakao
  if (!kakaoSdkPromise) {
    kakaoSdkPromise = new Promise((resolve, reject) => {
      const appKey = import.meta.env.OPENAPI_KAKAO_JAVASCRIPT_KEY
      if (!appKey) {
        reject(mapError('KAKAO_KEY_MISSING', 'Kakao JavaScript key is empty'))
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
      script.onerror = () => reject(mapError('KAKAO_SDK_LOAD_FAILED', 'Kakao SDK failed to load'))
      document.head.appendChild(script)
    })
  }
  await kakaoSdkPromise
  await new Promise((resolve) => window.kakao.maps.load(resolve))
  return window.kakao
}

function geocode(kakao, address) {
  return new Promise((resolve, reject) => {
    if (!address) {
      reject(mapError('GEOCODE_EMPTY', 'Address is empty'))
      return
    }
    const geocoder = new kakao.maps.services.Geocoder()
    geocoder.addressSearch(address, (results, status) => {
      if (status !== kakao.maps.services.Status.OK || !results.length) {
        reject(mapError('GEOCODE_NOT_FOUND', address))
        return
      }
      resolve({
        latitude: Number(results[0].y),
        longitude: Number(results[0].x),
      })
    })
  })
}

function mapLoadMessage(error) {
  if (error?.code === 'GEOCODE_EMPTY' || error?.code === 'GEOCODE_NOT_FOUND') {
    return `좌표를 찾지 못했습니다. '${error.message}' 주소가 건물명/사업명 형태라 Kakao 지도에서 검색되지 않을 수 있습니다.`
  }
  if (error?.code === 'KAKAO_KEY_MISSING' || error?.code === 'KAKAO_SDK_LOAD_FAILED') {
    return `지도를 불러오지 못했습니다. Kakao JavaScript 키와 Web 플랫폼 도메인(${window.location.origin})을 확인하세요.`
  }
  return '지도를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

async function pointForSupply(kakao, supply) {
  const latitude = Number(supply?.latitude)
  const longitude = Number(supply?.longitude)
  if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
    return { latitude, longitude }
  }
  return geocode(kakao, supplyMapAddress(supply))
}

async function renderMap() {
  await nextTick()
  if (!mapEl.value || !mapTarget.value) return
  try {
    const kakao = await loadKakaoSdk()
    const point = await pointForSupply(kakao, mapTarget.value)
    const center = new kakao.maps.LatLng(point.latitude, point.longitude)
    if (!kakaoMap) {
      kakaoMap = new kakao.maps.Map(mapEl.value, {
        center,
        level: 4,
      })
    }
    kakaoMap.setCenter(center)
    kakaoMap.setLevel(4)
    kakaoMarker?.setMap(null)
    kakaoInfoWindow?.close()
    kakaoMarker = new kakao.maps.Marker({
      map: kakaoMap,
      position: center,
    })
    const label = supplyMapAddress(mapTarget.value)
    kakaoInfoWindow = new kakao.maps.InfoWindow({
      content: `<div style="padding:10px 14px;font-weight:800;white-space:nowrap">${label}</div>`,
    })
    kakaoInfoWindow.open(kakaoMap, kakaoMarker)
    mapMessage.value = ''
  } catch (err) {
    mapMessage.value = mapLoadMessage(err)
  }
}

async function toggleFavorite() {
  if (!detail.value || favoriteLoading.value) return
  favoriteLoading.value = true
  try {
    const result = await favoriteMutation.mutateAsync(detail.value.notice.rentalNoticeId)
    favorite.value = Boolean(result.favorite)
  } catch (err) {
    if (err.response?.status === 401) {
      await router.push({
        path: '/login',
        query: { redirect: `/rentals/${detail.value.notice.rentalNoticeId}` },
      })
      return
    }
    error.value = '관심 공고 상태를 변경하지 못했습니다.'
  } finally {
    favoriteLoading.value = false
  }
}

watch(detailQuery.error, (nextError) => {
  error.value = nextError ? '공고 상세 정보를 불러오지 못했습니다.' : ''
})

watch(detail, async (nextDetail) => {
  favorite.value = false
  selectedSupply.value = nextDetail?.supplies?.[0] ?? null
  if (nextDetail?.notice?.title) {
    document.title = `${nextDetail.notice.title} | HOME FIT`
    await renderMap()
  }
}, { immediate: true })

onBeforeUnmount(() => {
  kakaoMarker?.setMap(null)
  kakaoInfoWindow?.close()
})
</script>

<template>
  <main class="min-h-[calc(100svh-80px)] bg-[#f4f0ea] px-6 py-20 text-[#171717]">
    <div class="mx-auto w-[min(1280px,calc(100vw-48px))]">
      <LoadingState v-if="loading" />
      <EmptyState v-else-if="error" :message="error" />
      <template v-else-if="detail">
        <RouterLink class="text-sm font-black text-[#b4212a]" to="/rentals">목록으로</RouterLink>

        <header class="mt-5 flex flex-wrap items-start justify-between gap-5">
          <div class="max-w-5xl">
            <p class="m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
              LH Rental Detail
            </p>
            <h1 class="mt-3 text-[clamp(30px,4vw,46px)] font-black leading-tight">
              {{ detail.notice.title }}
            </h1>
            <p class="mt-3 text-sm font-bold leading-7 text-neutral-500">
              {{ detail.notice.regionName }} · {{ detail.notice.noticeType }} ·
              {{ detail.notice.detailType }} · {{ detail.notice.status }}
            </p>
          </div>
          <div class="flex flex-wrap gap-2">
            <button
              type="button"
              data-testid="rental-favorite-toggle"
              class="inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-white px-[18px] font-black text-[#b4212a] disabled:cursor-wait disabled:opacity-60"
              :disabled="favoriteLoading"
              @click="toggleFavorite"
            >
              {{ favorite ? '관심 공고 해제' : '관심 공고 등록' }}
            </button>
            <a
              v-if="detail.notice.detailUrl"
              class="inline-flex min-h-11 items-center justify-center bg-[#b4212a] px-[18px] font-black text-white"
              :href="detail.notice.detailUrl"
              target="_blank"
              rel="noreferrer"
            >
              원문 보기
            </a>
          </div>
        </header>

        <section class="mt-8 grid gap-4 lg:grid-cols-[1.45fr_1fr]">
          <article class="border border-neutral-200 bg-white p-6">
            <h2 class="text-2xl font-black">공고 기본 정보</h2>
            <dl class="mt-5 grid gap-4 md:grid-cols-2">
              <div class="border-b border-neutral-100 pb-3">
                <dt class="text-xs font-black text-neutral-500">지역</dt>
                <dd class="mt-1 font-black">{{ value(detail.notice.regionName) }}</dd>
              </div>
              <div class="border-b border-neutral-100 pb-3">
                <dt class="text-xs font-black text-neutral-500">공급 유형</dt>
                <dd class="mt-1 font-black">{{ value(detail.notice.detailType) }}</dd>
              </div>
              <div class="border-b border-neutral-100 pb-3">
                <dt class="text-xs font-black text-neutral-500">신청 시작</dt>
                <dd class="mt-1 font-black">{{ value(detail.detail.noticeDate) }}</dd>
              </div>
              <div class="border-b border-neutral-100 pb-3">
                <dt class="text-xs font-black text-neutral-500">신청 마감</dt>
                <dd class="mt-1 font-black">{{ value(detail.detail.closeDate) }}</dd>
              </div>
              <div class="border-b border-neutral-100 pb-3">
                <dt class="text-xs font-black text-neutral-500">계약 장소</dt>
                <dd class="mt-1 font-black">{{ value(contractMapLabel) }}</dd>
              </div>
              <div class="border-b border-neutral-100 pb-3">
                <dt class="text-xs font-black text-neutral-500">문의</dt>
                <dd class="mt-1 font-black">{{ value(detail.detail.contact) }}</dd>
              </div>
            </dl>
          </article>

          <article class="border border-neutral-200 bg-white p-6">
            <h2 class="text-2xl font-black">마이데이터 자격 확인</h2>
            <template v-if="hasMyData && eligibility">
              <strong class="mt-5 block text-3xl font-black text-[#b4212a]">{{ eligibility.status }}</strong>
              <ul class="mt-4 grid gap-2 text-sm font-bold text-neutral-600">
                <li
                  v-for="check in eligibility.checks"
                  :key="check.key"
                  class="flex items-center justify-between border-b border-neutral-100 pb-2"
                >
                  <span>{{ check.message }}</span>
                  <span :class="check.passed ? 'text-emerald-600' : 'text-neutral-400'">
                    {{ check.passed ? '충족' : '확인' }}
                  </span>
                </li>
              </ul>
            </template>
            <template v-else>
              <p class="mt-4 text-sm font-bold leading-7 text-neutral-600">
                마이데이터를 입력하면 무주택, 소득, 자산, 희망 지역 기준을 바로 비교할 수 있습니다.
              </p>
              <RouterLink
                class="mt-5 inline-flex min-h-11 items-center justify-center bg-[#b4212a] px-[18px] font-black text-white"
                to="/mydata"
              >
                마이데이터 입력하러가기
              </RouterLink>
            </template>
          </article>
        </section>

        <section class="mt-7 overflow-hidden border border-neutral-200 bg-white">
          <div class="flex items-center gap-2 border-b-2 border-[#2f6ecb] px-5 py-4">
            <span class="grid h-5 w-5 place-items-center rounded-full bg-[#2f6ecb] text-xs font-black text-white">◆</span>
            <h2 class="text-xl font-black">공급필지 정보(입찰)</h2>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full min-w-[1040px] border-collapse text-center">
              <thead class="bg-[#f3f8fb]">
                <tr>
                  <th class="border border-neutral-200 px-4 py-4 text-sm font-black">공급용도</th>
                  <th class="border border-neutral-200 px-4 py-4 text-sm font-black">소재지</th>
                  <th class="border border-neutral-200 px-4 py-4 text-sm font-black">지번</th>
                  <th class="border border-neutral-200 px-4 py-4 text-sm font-black">면적(m²)</th>
                  <th class="border border-neutral-200 px-4 py-4 text-sm font-black">예정가격(원)</th>
                  <th class="border border-neutral-200 px-4 py-4 text-sm font-black">인터넷청약</th>
                  <th class="border border-neutral-200 px-4 py-4 text-sm font-black">지도보기</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(supply, index) in supplyRows" :key="`${supply.address}-${index}`">
                  <td class="border border-neutral-200 px-4 py-4 text-sm font-bold">{{ value(supply.usage) }}</td>
                  <td class="border border-neutral-200 px-4 py-4 text-sm font-bold">{{ value(supply.address) }}</td>
                  <td class="border border-neutral-200 px-4 py-4 text-sm font-bold">{{ value(supply.lotNumber) }}</td>
                  <td class="border border-neutral-200 px-4 py-4 text-sm font-bold">{{ value(supply.area) }}</td>
                  <td class="border border-neutral-200 px-4 py-4 text-right text-sm font-bold">
                    {{ value(supply.expectedAmount) }}
                  </td>
                  <td class="border border-neutral-200 px-4 py-4 text-sm font-bold">
                    {{ value(supply.internetApplyStatus) }}
                  </td>
                  <td class="border border-neutral-200 px-4 py-4">
                    <button
                      type="button"
                      class="min-h-9 rounded bg-[#00a991] px-4 text-sm font-black text-white"
                      @click="selectSupplyOnMap(supply)"
                    >
                      필지바로가기
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section class="mt-7 overflow-hidden border border-neutral-200 bg-white">
          <div class="flex items-center gap-2 px-5 py-4">
            <span class="grid h-5 w-5 place-items-center rounded-full bg-[#2f6ecb] text-xs font-black text-white">◆</span>
            <h2 class="text-xl font-black">계약장소 관련 위치 정보</h2>
          </div>
          <div class="relative h-[500px] border-t border-neutral-200 bg-neutral-100">
            <div ref="mapEl" class="h-full w-full"></div>
            <div
              v-if="mapMessage"
              class="absolute left-5 top-5 max-w-md border border-red-200 bg-white px-4 py-3 text-sm font-black text-red-700 shadow"
            >
              {{ mapMessage }}
            </div>
          </div>
        </section>
      </template>
    </div>
  </main>
</template>
