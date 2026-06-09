<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { deleteTransfer, fetchTransferDetail } from '@/entities/transfer/api/transferApi'
import LoadingState from '@/shared/ui/LoadingState.vue'

const route = useRoute()
const router = useRouter()
const loading = ref(true)
const post = ref(null)

function formatMoney(value) {
  if (value === undefined || value === null || value === '') return '-'
  return `${Number(value).toLocaleString()}만원`
}

onMounted(async () => {
  loading.value = true
  try {
    post.value = await fetchTransferDetail(route.params.transferId)
    document.title = `${post.value.title} | SSAFY Home`
  } finally {
    loading.value = false
  }
})

async function removeTransfer() {
  if (!window.confirm('양도글을 삭제할까요?')) return
  await deleteTransfer(route.params.transferId)
  router.push('/transfers')
}
</script>

<template>
  <main class="shell page-shell">
    <LoadingState v-if="loading" />
    <template v-else-if="post">
      <RouterLink class="text-link" to="/transfers">← 목록으로</RouterLink>
      <div class="section-head">
        <div>
          <p class="eyebrow">Transfer Detail</p>
          <h1 class="page-title">{{ post.title }}</h1>
          <p class="muted">{{ post.address }} {{ post.detailAddress }} · {{ post.status }}</p>
        </div>
        <div class="detail-actions">
          <RouterLink class="button" :to="`/transfers/${post.transferId}/edit`">수정</RouterLink>
          <button type="button" class="button danger" @click="removeTransfer">삭제</button>
          <a class="button primary" :href="`tel:${post.contactPhone}`">연락하기</a>
        </div>
      </div>

      <section v-if="post.imageUrls?.length" class="transfer-gallery">
        <img class="transfer-gallery-main" :src="post.imageUrls[0]" :alt="post.title" />
        <div v-if="post.imageUrls.length > 1" class="transfer-gallery-thumbs">
          <img v-for="imageUrl in post.imageUrls.slice(1)" :key="imageUrl" :src="imageUrl" :alt="post.title" />
        </div>
      </section>

      <section class="split transfer-detail-layout">
        <article class="panel">
          <h2>양도 조건</h2>
          <dl class="detail-grid">
            <div><strong>보증금</strong><span>{{ formatMoney(post.depositAmount) }}</span></div>
            <div><strong>월세</strong><span>{{ formatMoney(post.monthlyRentAmount) }}</span></div>
            <div><strong>관리비</strong><span>{{ formatMoney(post.maintenanceFee) }}</span></div>
            <div><strong>양도비</strong><span>{{ formatMoney(post.transferFee) }}</span></div>
            <div><strong>전용면적</strong><span>{{ post.exclusiveArea || '-' }}㎡</span></div>
            <div><strong>층수</strong><span>{{ post.floor || '-' }}</span></div>
            <div><strong>입주 가능일</strong><span>{{ post.moveInDate || '-' }}</span></div>
            <div><strong>계약 종료일</strong><span>{{ post.contractEndDate || '-' }}</span></div>
          </dl>
        </article>

        <article class="panel">
          <h2>상세 설명</h2>
          <p class="notice-body">{{ post.content }}</p>
          <div class="contact-box">
            <span>연락처</span>
            <strong>{{ post.contactPhone || '-' }}</strong>
          </div>
        </article>
      </section>
    </template>
  </main>
</template>
