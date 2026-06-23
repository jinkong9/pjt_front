<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  toggleFavoriteRentalNotice,
} from '@/entities/rental/api/rentalApi'
import { rentalKeys, rentalQueryOptions } from '@/entities/rental/model/rentalQueries'
import EmptyState from '@/shared/ui/EmptyState.vue'
import LoadingState from '@/shared/ui/LoadingState.vue'

const route = useRoute()
const router = useRouter()
const queryClient = useQueryClient()
const recommendationFavoriteMessage = ref('')
const condition = reactive({
  keyword: '',
  regionCode: '',
  status: '',
  page: 1,
  size: 12,
})
const submittedCondition = ref({ ...condition })

const regions = [
  { label: '전체', value: '' },
  { label: '서울', value: '11' },
  { label: '부산', value: '26' },
  { label: '대구', value: '27' },
  { label: '인천', value: '28' },
  { label: '광주', value: '29' },
  { label: '대전', value: '30' },
  { label: '울산', value: '31' },
  { label: '세종', value: '36' },
  { label: '경기', value: '41' },
  { label: '강원', value: '51' },
  { label: '충북', value: '43' },
  { label: '충남', value: '44' },
  { label: '전북', value: '52' },
  { label: '전남', value: '46' },
  { label: '경북', value: '47' },
  { label: '경남', value: '48' },
  { label: '제주', value: '50' },
]

function syncFromRoute() {
  condition.keyword = route.query.keyword || ''
  condition.regionCode = route.query.regionCode || ''
  condition.status = route.query.status || ''
}

async function loadRentals() {
  submittedCondition.value = { ...condition }
}

const noticesQuery = useQuery(computed(() => rentalQueryOptions.list(submittedCondition.value)))
const recommendationsQuery = useQuery(rentalQueryOptions.recommendations(10))
const favoriteMutation = useMutation({
  mutationFn: (noticeId) => toggleFavoriteRentalNotice(noticeId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: rentalKeys.favorites() })
    queryClient.invalidateQueries({ queryKey: rentalKeys.recommendations(10) })
    queryClient.invalidateQueries({ queryKey: rentalKeys.all })
  },
})

const notices = computed(() => noticesQuery.data.value ?? [])
const loading = computed(() => noticesQuery.isPending.value)
const recommendations = computed(() => recommendationsQuery.data.value ?? [])
const recommendationLoading = computed(() => recommendationsQuery.isPending.value)
const recommendationError = computed(() => {
  const err = recommendationsQuery.error.value
  if (!err) return ''
  if (err.response?.status === 401) {
    return 'login'
  }
  if (err.response?.status === 409) {
    return 'profile'
  }
  return 'unknown'
})

async function toggleRecommendationFavorite(noticeId) {
  recommendationFavoriteMessage.value = ''
  try {
    const result = await favoriteMutation.mutateAsync(noticeId)
    recommendationFavoriteMessage.value = result.favorite
      ? '관심 공고로 등록했습니다.'
      : '관심 공고에서 해제했습니다.'
  } catch (err) {
    if (err.response?.status === 401) {
      await router.push({
        path: '/login',
        query: { redirect: '/rentals' },
      })
      return
    }
    recommendationFavoriteMessage.value = '관심 공고 상태를 변경하지 못했습니다.'
  }
}

async function toggleNoticeFavorite(noticeId) {
  recommendationFavoriteMessage.value = ''
  try {
    const result = await favoriteMutation.mutateAsync(noticeId)
    recommendationFavoriteMessage.value = result.favorite
      ? '관심 공고로 등록했습니다.'
      : '관심 공고에서 해제했습니다.'
  } catch (err) {
    if (err.response?.status === 401) {
      await router.push({
        path: '/login',
        query: { redirect: '/rentals' },
      })
      return
    }
    recommendationFavoriteMessage.value = '관심 공고 상태를 변경하지 못했습니다.'
  }
}

async function search() {
  condition.page = 1
  await router.push({ path: '/rentals', query: { ...condition } })
  await loadRentals()
}

onMounted(async () => {
  document.title = '공공임대 공고 | SSAFY Home'
  syncFromRoute()
  await loadRentals()
})
</script>

<template>
  <main class="shell page-shell mx-auto w-[min(1480px,calc(100%_-_48px))] py-24">
    <div class="section-head mb-7 flex flex-wrap items-end justify-between gap-5">
      <div>
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
          Public Rental
        </p>
        <h1 class="page-title mt-3 max-w-4xl text-[clamp(34px,5vw,56px)] font-black leading-tight">
          공공임대 공고
        </h1>
        <p class="muted mt-3 text-sm font-bold leading-7 text-neutral-500">
          LH 공공임대 공고를 지역, 유형, 접수 상태 기준으로 확인합니다.
        </p>
      </div>
    </div>

    <section class="mb-6 border border-neutral-200 bg-white p-5">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.2em] text-[#b4212a]">
            Recommendation
          </p>
          <h2 class="mt-2 text-[28px] font-black text-[#171717]">나에게 맞는 LH 추천</h2>
        </div>
        <p
          v-if="recommendationFavoriteMessage"
          class="border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-black text-emerald-700"
        >
          {{ recommendationFavoriteMessage }}
        </p>
      </div>

      <p v-if="recommendationLoading" class="mt-4 text-sm font-black text-neutral-500">
        추천 공고를 불러오는 중입니다.
      </p>
      <div v-else-if="recommendationError === 'login'" class="mt-4 flex flex-wrap items-center justify-between gap-4 bg-[#faf8f5] p-4">
        <p class="text-sm font-bold text-neutral-600">로그인하면 맞춤 LH 추천을 볼 수 있습니다.</p>
        <RouterLink
          class="inline-flex min-h-10 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-4 text-sm font-black text-white"
          :to="{ path: '/login', query: { redirect: '/rentals' } }"
        >
          로그인
        </RouterLink>
      </div>
      <div v-else-if="recommendationError === 'profile'" class="mt-4 flex flex-wrap items-center justify-between gap-4 bg-[#faf8f5] p-4">
        <p class="text-sm font-bold text-neutral-600">금융 프로필을 먼저 입력해 주세요.</p>
        <RouterLink
          class="inline-flex min-h-10 items-center justify-center border border-[#171717] bg-[#171717] px-4 text-sm font-black text-white"
          to="/member"
        >
          프로필 입력
        </RouterLink>
      </div>
      <p v-else-if="recommendationError" class="mt-4 text-sm font-black text-red-700">
        추천 공고를 불러오지 못했습니다.
      </p>
      <div v-else-if="recommendations.length" class="mt-4 grid gap-4 lg:grid-cols-2">
        <article
          v-for="item in recommendations"
          :key="item.notice.rentalNoticeId"
          class="border border-neutral-200 bg-[#fafafa] p-4"
        >
          <div class="flex items-start justify-between gap-3">
            <div>
              <span class="tag bg-[#f7f4ef] px-3 py-1 text-xs font-black text-[#b4212a]">
                {{ item.notice.status || '공고' }}
              </span>
              <h3 class="mt-3 text-xl font-black">{{ item.notice.title }}</h3>
              <p class="mt-1 text-sm font-bold text-neutral-500">{{ item.notice.regionName }}</p>
            </div>
            <strong class="text-2xl font-black text-[#b4212a]">{{ item.score }}</strong>
          </div>
          <ul class="mt-4 grid gap-1 text-sm font-bold text-neutral-600">
            <li v-for="reason in item.reasons" :key="reason">{{ reason }}</li>
          </ul>
          <p v-if="item.supplies[0]" class="mt-3 text-sm font-bold text-neutral-500">
            {{ item.supplies[0].area || '-' }}m² · {{ item.supplies[0].expectedAmount || '-' }}
          </p>
          <div class="mt-4 flex flex-wrap gap-2">
            <RouterLink
              class="inline-flex min-h-10 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-4 text-sm font-black text-white"
              :to="`/rentals/${item.notice.rentalNoticeId}`"
            >
              상세 보기
            </RouterLink>
            <button
              type="button"
              :data-testid="`recommendation-favorite-${item.notice.rentalNoticeId}`"
              class="inline-flex min-h-10 items-center justify-center border border-neutral-300 bg-white px-4 text-sm font-black text-neutral-700"
              @click="toggleRecommendationFavorite(item.notice.rentalNoticeId)"
            >
              관심 등록
            </button>
          </div>
        </article>
      </div>
      <p v-else class="mt-4 text-sm font-bold text-neutral-500">현재 추천할 LH 공고가 없습니다.</p>
    </section>

    <form
      class="search mb-6 grid gap-3 border border-neutral-200 bg-white p-4 md:grid-cols-[1fr_180px_180px_auto]"
      @submit.prevent="search"
    >
      <input
        v-model="condition.keyword"
        class="min-h-11 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold text-[#171717] outline-0"
        placeholder="공고명, 지역 검색"
      />
      <select
        v-model="condition.regionCode"
        class="min-h-11 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold text-[#171717] outline-0"
      >
        <option v-for="region in regions" :key="region.value" :value="region.value">{{ region.label }}</option>
      </select>
      <select
        v-model="condition.status"
        class="min-h-11 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold text-[#171717] outline-0"
      >
        <option value="">상태 전체</option>
        <option value="공고중">공고중</option>
        <option value="접수예정">접수예정</option>
        <option value="마감">마감</option>
      </select>
      <button
        type="submit"
        class="inline-flex min-h-11 items-center justify-center border border-[#171717] bg-[#171717] px-[18px] font-black text-white"
      >
        조회
      </button>
    </form>

    <LoadingState v-if="loading" />
    <EmptyState v-else-if="!notices.length" message="조회된 공고가 없습니다." />
    <div v-else class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      <article
        v-for="notice in notices"
        :key="notice.rentalNoticeId"
        class="card flex min-h-[278px] flex-col border border-neutral-200 bg-white p-5 transition hover:-translate-y-1 hover:border-[#b4212a] hover:shadow-[0_18px_40px_rgba(23,23,23,0.12)]"
      >
        <div class="mb-4 flex items-center justify-between gap-3">
          <span class="tag bg-[#f7f4ef] px-3 py-1 text-xs font-black text-[#b4212a]">
            {{ notice.status || '공고' }}
          </span>
          <span class="text-xs font-black text-neutral-400">{{ notice.regionName }}</span>
        </div>
        <h3
          class="mb-3 min-h-[56px] overflow-hidden text-[20px] font-black leading-7 text-[#171717] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
        >
          {{ notice.title }}
        </h3>
        <dl class="grid gap-2 text-sm font-bold text-neutral-600">
          <div class="flex justify-between gap-3">
            <dt class="text-neutral-400">유형</dt>
            <dd class="text-right">{{ notice.noticeType }} · {{ notice.detailType }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-neutral-400">신청기간</dt>
            <dd class="text-right">{{ notice.applicationPeriod || notice.closeDate || '-' }}</dd>
          </div>
          <div class="flex justify-between gap-3">
            <dt class="text-neutral-400">공고일</dt>
            <dd class="text-right">{{ notice.noticeDate || '-' }}</dd>
          </div>
        </dl>
        <div class="mt-auto grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
          <RouterLink
            class="button primary inline-flex min-h-10 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] text-sm font-black text-white"
            :to="`/rentals/${notice.rentalNoticeId}`"
          >
            상세 보기
          </RouterLink>
          <button
            type="button"
            :data-testid="`notice-favorite-${notice.rentalNoticeId}`"
            class="inline-flex min-h-10 items-center justify-center border border-[#b4212a] bg-white px-4 text-sm font-black text-[#b4212a]"
            @click="toggleNoticeFavorite(notice.rentalNoticeId)"
          >
            관심
          </button>
        </div>
      </article>
    </div>
  </main>
</template>
