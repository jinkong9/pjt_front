<script setup>
import { onMounted, reactive, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { api, toQuery } from '@/shared/api/client'
import EmptyState from '@/shared/ui/EmptyState.vue'
import LoadingState from '@/shared/ui/LoadingState.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const notices = ref([])
const condition = reactive({
  keyword: '',
  regionCode: '',
  status: '',
  page: 1,
  size: 12,
})

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
  loading.value = true
  try {
    const { data } = await api.get('/rentals', { params: toQuery(condition) })
    notices.value = data
  } finally {
    loading.value = false
  }
}

async function search() {
  await router.push({ path: '/rentals', query: toQuery(condition) })
  await loadRentals()
}

onMounted(async () => {
  syncFromRoute()
  await loadRentals()
})
</script>

<template>
  <main class="shell page-shell mx-auto w-[min(1480px,calc(100%_-_48px))] py-28">
    <div class="section-head mb-8 flex items-end justify-between gap-6">
      <div>
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
          Public Rental
        </p>
        <h1 class="page-title mt-3 max-w-4xl text-[clamp(42px,6vw,76px)] font-black leading-none">
          공공임대 공고
        </h1>
        <p class="muted mt-3 text-sm font-bold leading-7 text-neutral-500">
          LH 공공임대 공고를 지역과 상태 기준으로 조회합니다.
        </p>
      </div>
    </div>

    <form
      class="search mb-6 grid grid-cols-[repeat(3,minmax(0,1fr))_auto] gap-3 border border-neutral-200 bg-white p-4"
      @submit.prevent="search"
    >
      <input
        v-model="condition.keyword"
        class="min-h-12 w-full border-0 bg-white text-[15px] font-extrabold text-[#171717] outline-0"
        placeholder="키워드"
      />
      <select
        v-model="condition.regionCode"
        class="min-h-12 w-full border-0 bg-white text-[15px] font-extrabold text-[#171717] outline-0"
      >
        <option v-for="region in regions" :key="region.value" :value="region.value">{{ region.label }}</option>
      </select>
      <select
        v-model="condition.status"
        class="min-h-12 w-full border-0 bg-white text-[15px] font-extrabold text-[#171717] outline-0"
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
    <div v-else class="grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
      <article
        v-for="notice in notices"
        :key="notice.noticeId"
        class="card grid gap-4 border border-neutral-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(23,23,23,0.12)]"
      >
        <span
          class="tag w-fit bg-[#f7f4ef] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]"
          >{{ notice.status || 'RENTAL' }}</span
        >
        <h3 class="mb-0 text-[22px] font-black text-[#171717]">{{ notice.title }}</h3>
        <p class="muted text-sm font-bold leading-7 text-neutral-500">
          {{ notice.regionName }} · {{ notice.noticeType }} · {{ notice.detailType }}
        </p>
        <p>
          공고일 {{ notice.noticeDate || '-' }}<br />
          마감일 {{ notice.closeDate || '-' }}
        </p>
        <RouterLink
          class="button primary inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white"
          :to="`/rentals/${notice.noticeId}`"
          >상세 보기</RouterLink
        >
      </article>
    </div>
  </main>
</template>
