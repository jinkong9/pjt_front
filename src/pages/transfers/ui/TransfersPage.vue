<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { RouterLink } from 'vue-router'
import { toggleFavoriteTransfer } from '@/entities/transfer/api/transferApi'
import { transferKeys, transferQueryOptions } from '@/entities/transfer/model/transferQueries'
import EmptyState from '@/shared/ui/EmptyState.vue'
import LoadingState from '@/shared/ui/LoadingState.vue'

const queryClient = useQueryClient()
const brokenImages = ref(new Set())
const favoriteMessage = ref('')
const condition = reactive({
  keyword: '',
  status: '',
})
const submittedCondition = ref({ ...condition })
const transfersQuery = useQuery(computed(() => transferQueryOptions.list(submittedCondition.value)))
const favoriteMutation = useMutation({
  mutationFn: (transferId) => toggleFavoriteTransfer(transferId),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: transferKeys.all })
  },
})
const transfers = computed(() => transfersQuery.data.value ?? [])
const loading = computed(() => transfersQuery.isPending.value)

const availableCount = computed(() => transfers.value.filter((post) => post.status === '양도가능').length)

function formatMoney(value) {
  if (value === undefined || value === null || value === '') return '-'
  return `${Number(value).toLocaleString()}만원`
}

function markBrokenImage(transferId) {
  brokenImages.value = new Set([...brokenImages.value, transferId])
}

async function loadTransfers() {
  submittedCondition.value = { ...condition }
}

async function toggleFavorite(transferId) {
  favoriteMessage.value = ''
  try {
    const result = await favoriteMutation.mutateAsync(transferId)
    favoriteMessage.value = result.favorite
      ? '관심 매물로 등록했습니다.'
      : '관심 매물에서 해제했습니다.'
  } catch {
    favoriteMessage.value = '관심 매물 상태를 변경하지 못했습니다.'
  }
}

onMounted(() => {
  document.title = '양도 게시판 | SSAFY Home'
  loadTransfers()
})
</script>

<template>
  <main class="shell page-shell mx-auto w-[min(1480px,calc(100%_-_48px))] py-24">
    <div class="section-head mb-7 flex flex-wrap items-end justify-between gap-5">
      <div>
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
          Transfer Board
        </p>
        <h1 class="page-title mt-3 max-w-4xl text-[clamp(34px,5vw,56px)] font-black leading-tight">
          양도 게시판
        </h1>
        <p class="muted mt-3 text-sm font-bold leading-7 text-neutral-500">
          계약 기간이 남은 월세 매물을 보증금, 월세, 입주 일정 기준으로 확인합니다.
        </p>
      </div>
      <div class="transfer-head-actions flex items-center gap-3">
        <div class="panel stat-panel min-w-32 border border-neutral-200 bg-white p-4 text-right">
          <span class="block text-xs font-black uppercase tracking-[0.14em] text-neutral-500">양도 가능</span>
          <strong class="mt-1 block text-3xl font-black text-[#b4212a]">{{ availableCount }}</strong>
        </div>
        <RouterLink
          class="button primary inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white"
          to="/transfers/new"
        >
          글쓰기
        </RouterLink>
      </div>
    </div>

    <form
      class="search transfer-search mb-6 grid gap-3 border border-neutral-200 bg-white p-4 md:grid-cols-[1fr_220px_auto]"
      @submit.prevent="loadTransfers"
    >
      <label class="search-field grid gap-1.5">
        <span class="text-xs font-black text-neutral-500">검색어</span>
        <input
          v-model="condition.keyword"
          class="min-h-9 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold text-[#171717] outline-0"
          placeholder="지역, 건물명, 제목 검색"
        />
      </label>
      <label class="search-field grid gap-1.5">
        <span class="text-xs font-black text-neutral-500">상태</span>
        <select
          v-model="condition.status"
          class="min-h-9 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold text-[#171717] outline-0"
        >
          <option value="">상태 전체</option>
          <option value="양도가능">양도가능</option>
          <option value="협의중">협의중</option>
          <option value="완료">완료</option>
        </select>
      </label>
      <button
        type="submit"
        class="inline-flex min-h-11 items-center justify-center self-end border border-[#171717] bg-[#171717] px-[18px] font-black text-white"
      >
        조회
      </button>
    </form>

    <LoadingState v-if="loading" />
    <template v-else>
      <p
        v-if="favoriteMessage"
        class="mb-4 border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-700"
      >
        {{ favoriteMessage }}
      </p>
      <EmptyState v-if="!transfers.length" message="조회된 양도글이 없습니다." />
      <div
        v-else
        data-testid="transfer-card-grid"
        class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3"
      >
      <article
        v-for="post in transfers"
        :key="post.transferId"
        class="card transfer-card flex min-h-[360px] flex-col border border-neutral-200 bg-white p-4 transition hover:-translate-y-1 hover:border-[#b4212a] hover:shadow-[0_18px_40px_rgba(23,23,23,0.12)]"
      >
        <RouterLink
          :data-testid="`transfer-card-image-${post.transferId}`"
          class="transfer-card-image m-0 grid aspect-[16/10] min-h-0 w-full place-items-center overflow-hidden bg-[#f7f4ef] text-xs font-black tracking-[0.16em] text-neutral-400"
          :to="`/transfers/${post.transferId}`"
        >
          <img
            v-if="post.imageUrls?.length && !brokenImages.has(post.transferId)"
            class="!h-full w-full object-cover"
            :src="post.imageUrls[0]"
            :alt="post.title"
            @error="markBrokenImage(post.transferId)"
          />
          <span v-else>NO IMAGE</span>
        </RouterLink>
        <div class="mt-4 flex items-center justify-between gap-3">
          <span class="tag bg-[#f7f4ef] px-3 py-1 text-xs font-black text-[#b4212a]">{{ post.status || '상태 미정' }}</span>
          <span class="muted text-xs font-bold text-neutral-500">조회 {{ post.viewCount ?? 0 }}</span>
        </div>
        <h3
          class="mt-3 min-h-[52px] overflow-hidden text-[19px] font-black leading-[26px] text-[#171717] [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]"
        >
          {{ post.title }}
        </h3>
        <p class="muted mt-2 overflow-hidden text-sm font-bold leading-6 text-neutral-500 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:1]">
          {{ post.address }} {{ post.detailAddress }}
        </p>
        <dl class="mt-3 grid grid-cols-2 gap-2 border-y border-neutral-100 py-3 text-sm">
          <div>
            <dt class="text-xs font-black text-neutral-500">보증금</dt>
            <dd class="font-black">{{ formatMoney(post.depositAmount) }}</dd>
          </div>
          <div>
            <dt class="text-xs font-black text-neutral-500">월세</dt>
            <dd class="font-black">{{ formatMoney(post.monthlyRentAmount) }}</dd>
          </div>
          <div>
            <dt class="text-xs font-black text-neutral-500">관리비</dt>
            <dd class="font-black">{{ formatMoney(post.maintenanceFee) }}</dd>
          </div>
          <div>
            <dt class="text-xs font-black text-neutral-500">양도비</dt>
            <dd class="font-black">{{ formatMoney(post.transferFee) }}</dd>
          </div>
        </dl>
        <p class="muted mt-3 text-sm font-bold leading-6 text-neutral-500">
          입주 {{ post.moveInDate || '-' }} · 계약 종료 {{ post.contractEndDate || '-' }}<br />
          {{ post.exclusiveArea || '-' }}㎡ · {{ post.floor || '-' }}
        </p>
        <div class="mt-auto grid grid-cols-[1fr_auto] gap-2">
          <RouterLink
            class="button primary inline-flex min-h-10 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] text-sm font-black text-white"
            :to="`/transfers/${post.transferId}`"
          >
            상세 보기
          </RouterLink>
          <button
            type="button"
            :data-testid="`transfer-favorite-${post.transferId}`"
            class="inline-flex min-h-10 items-center justify-center border border-[#b4212a] bg-white px-4 text-sm font-black text-[#b4212a]"
            @click="toggleFavorite(post.transferId)"
          >
            관심
          </button>
        </div>
      </article>
      </div>
    </template>
  </main>
</template>
