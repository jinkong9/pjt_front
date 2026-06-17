<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { fetchTransfers } from '@/entities/transfer/api/transferApi'
import EmptyState from '@/shared/ui/EmptyState.vue'
import LoadingState from '@/shared/ui/LoadingState.vue'

const loading = ref(false)
const transfers = ref([])
const condition = reactive({
  keyword: '',
  status: '',
})

const availableCount = computed(() => transfers.value.filter((post) => post.status === '양도가능').length)

function formatMoney(value) {
  if (value === undefined || value === null || value === '') return '-'
  return `${Number(value).toLocaleString()}만원`
}

async function loadTransfers() {
  loading.value = true
  try {
    transfers.value = await fetchTransfers(condition)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  document.title = '양도 게시판 | SSAFY Home'
  loadTransfers()
})
</script>

<template>
  <main class="shell page-shell mx-auto w-[min(1480px,calc(100%_-_48px))] py-28">
    <div class="section-head mb-8 flex items-end justify-between gap-6">
      <div>
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
          Transfer Board
        </p>
        <h1 class="page-title mt-3 max-w-4xl text-[clamp(42px,6vw,76px)] font-black leading-none">
          양도 게시판
        </h1>
        <p class="muted mt-3 text-sm font-bold leading-7 text-neutral-500">
          계약 기간이 남은 전월세 매물을 조건과 입주 일정 기준으로 확인합니다.
        </p>
      </div>
      <div class="transfer-head-actions flex items-center gap-3">
        <div class="panel stat-panel min-w-36 border border-neutral-200 bg-white p-4 text-right">
          <span class="block text-xs font-black uppercase tracking-[0.14em] text-neutral-500">양도 가능</span>
          <strong class="mt-1 block text-3xl font-black text-[#b4212a]">{{ availableCount }}</strong>
        </div>
        <RouterLink
          class="button primary inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white"
          to="/transfers/new"
          >글쓰기</RouterLink
        >
      </div>
    </div>

    <form
      class="search transfer-search mb-6 grid grid-cols-[1fr_240px_auto] gap-3 border border-neutral-200 bg-white p-4"
      @submit.prevent="loadTransfers"
    >
      <label class="search-field grid gap-1.5 border-r border-neutral-200 pr-4">
        <span class="text-xs font-black text-neutral-500">검색어</span>
        <input
          v-model="condition.keyword"
          class="min-h-8 w-full border-0 bg-white text-[15px] font-extrabold text-[#171717] outline-0"
          placeholder="지역, 건물명, 제목 검색"
        />
      </label>
      <label class="search-field grid gap-1.5 border-r border-neutral-200 pr-4">
        <span class="text-xs font-black text-neutral-500">상태</span>
        <select
          v-model="condition.status"
          class="min-h-8 w-full border-0 bg-white text-[15px] font-extrabold text-[#171717] outline-0"
        >
          <option value="">상태 전체</option>
          <option value="양도가능">양도가능</option>
          <option value="협의중">협의중</option>
          <option value="완료">완료</option>
        </select>
      </label>
      <button
        type="submit"
        class="inline-flex min-h-11 items-center justify-center border border-[#171717] bg-[#171717] px-[18px] font-black text-white"
      >
        조회
      </button>
    </form>

    <LoadingState v-if="loading" />
    <EmptyState v-else-if="!transfers.length" message="조회된 양도글이 없습니다." />
    <div v-else class="grid transfer-grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] gap-4">
      <article
        v-for="post in transfers"
        :key="post.transferId"
        class="card transfer-card grid gap-4 border border-neutral-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(23,23,23,0.12)]"
      >
        <RouterLink
          class="transfer-card-image grid aspect-[4/3] place-items-center overflow-hidden bg-[#f7f4ef] text-xs font-black tracking-[0.16em] text-neutral-400"
          :to="`/transfers/${post.transferId}`"
        >
          <img v-if="post.imageUrls?.length" class="h-full w-full object-cover" :src="post.imageUrls[0]" :alt="post.title" />
          <span v-else>NO IMAGE</span>
        </RouterLink>
        <div class="card-topline flex items-center justify-between gap-3">
          <span
            class="tag bg-[#f7f4ef] px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]"
            >{{ post.status }}</span
          >
          <span class="muted text-xs font-bold text-neutral-500">조회 {{ post.viewCount ?? 0 }}</span>
        </div>
        <h3 class="mb-0 text-[22px] font-black text-[#171717]">{{ post.title }}</h3>
        <p class="muted text-sm font-bold leading-7 text-neutral-500">{{ post.address }} {{ post.detailAddress }}</p>
        <dl class="transfer-terms grid grid-cols-2 gap-2 border-y border-neutral-100 py-3">
          <div class="grid gap-1">
            <dt class="text-xs font-black text-neutral-500">보증금</dt>
            <dd class="font-black">{{ formatMoney(post.depositAmount) }}</dd>
          </div>
          <div class="grid gap-1">
            <dt class="text-xs font-black text-neutral-500">월세</dt>
            <dd class="font-black">{{ formatMoney(post.monthlyRentAmount) }}</dd>
          </div>
          <div class="grid gap-1">
            <dt class="text-xs font-black text-neutral-500">관리비</dt>
            <dd class="font-black">{{ formatMoney(post.maintenanceFee) }}</dd>
          </div>
          <div class="grid gap-1">
            <dt class="text-xs font-black text-neutral-500">양도비</dt>
            <dd class="font-black">{{ formatMoney(post.transferFee) }}</dd>
          </div>
        </dl>
        <p class="muted text-sm font-bold leading-7 text-neutral-500">
          입주 {{ post.moveInDate || '-' }} · 계약 종료 {{ post.contractEndDate || '-' }}<br />
          {{ post.exclusiveArea || '-' }}㎡ · {{ post.floor || '-' }}
        </p>
        <RouterLink
          class="button primary inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white"
          :to="`/transfers/${post.transferId}`"
          >상세 보기</RouterLink
        >
      </article>
    </div>
  </main>
</template>
