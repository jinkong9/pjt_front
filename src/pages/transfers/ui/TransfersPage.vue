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
  <main class="shell page-shell">
    <div class="section-head">
      <div>
        <p class="eyebrow">Transfer Board</p>
        <h1 class="page-title">양도 게시판</h1>
        <p class="muted">계약 기간이 남은 전월세 매물을 조건과 입주 일정 기준으로 확인합니다.</p>
      </div>
      <div class="panel stat-panel">
        <span>양도 가능</span>
        <strong>{{ availableCount }}</strong>
      </div>
    </div>

    <form class="search transfer-search" @submit.prevent="loadTransfers">
      <label class="search-field">
        <span>검색어</span>
        <input v-model="condition.keyword" placeholder="지역, 건물명, 제목 검색" />
      </label>
      <label class="search-field">
        <span>상태</span>
        <select v-model="condition.status">
          <option value="">상태 전체</option>
          <option value="양도가능">양도가능</option>
          <option value="협의중">협의중</option>
          <option value="완료">완료</option>
        </select>
      </label>
      <button type="submit">조회</button>
    </form>

    <LoadingState v-if="loading" />
    <EmptyState v-else-if="!transfers.length" message="조회된 양도글이 없습니다." />
    <div v-else class="grid transfer-grid">
      <article v-for="post in transfers" :key="post.transferId" class="card transfer-card">
        <div class="card-topline">
          <span class="tag">{{ post.status }}</span>
          <span class="muted">조회 {{ post.viewCount ?? 0 }}</span>
        </div>
        <h3>{{ post.title }}</h3>
        <p class="muted">{{ post.address }} {{ post.detailAddress }}</p>
        <dl class="transfer-terms">
          <div>
            <dt>보증금</dt>
            <dd>{{ formatMoney(post.depositAmount) }}</dd>
          </div>
          <div>
            <dt>월세</dt>
            <dd>{{ formatMoney(post.monthlyRentAmount) }}</dd>
          </div>
          <div>
            <dt>관리비</dt>
            <dd>{{ formatMoney(post.maintenanceFee) }}</dd>
          </div>
          <div>
            <dt>양도비</dt>
            <dd>{{ formatMoney(post.transferFee) }}</dd>
          </div>
        </dl>
        <p class="muted">
          입주 {{ post.moveInDate || '-' }} · 계약 종료 {{ post.contractEndDate || '-' }}<br />
          {{ post.exclusiveArea || '-' }}㎡ · {{ post.floor || '-' }}
        </p>
        <RouterLink class="button primary" :to="`/transfers/${post.transferId}`">상세 보기</RouterLink>
      </article>
    </div>
  </main>
</template>
