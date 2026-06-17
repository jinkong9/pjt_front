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
  <main class="shell page-shell mx-auto w-[min(1480px,calc(100%_-_48px))] py-28">
    <LoadingState v-if="loading" />
    <template v-else-if="post">
      <RouterLink class="text-link text-sm font-black text-[#b4212a]" to="/transfers">← 목록으로</RouterLink>
      <div class="section-head mb-8 mt-6 flex items-end justify-between gap-6">
        <div>
          <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
            Transfer Detail
          </p>
          <h1 class="page-title mt-3 max-w-4xl text-[clamp(42px,6vw,76px)] font-black leading-none">
            {{ post.title }}
          </h1>
          <p class="muted mt-3 text-sm font-bold leading-7 text-neutral-500">
            {{ post.address }} {{ post.detailAddress }} · {{ post.status }}
          </p>
        </div>
        <div class="detail-actions flex flex-wrap gap-2">
          <RouterLink
            class="button inline-flex min-h-11 items-center justify-center border border-[#171717] bg-[#171717] px-[18px] font-black text-white"
            :to="`/transfers/${post.transferId}/edit`"
            >수정</RouterLink
          >
          <button
            type="button"
            class="button danger inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-white px-[18px] font-black text-[#b4212a]"
            @click="removeTransfer"
          >
            삭제
          </button>
          <a
            class="button primary inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white"
            :href="`tel:${post.contactPhone}`"
            >연락하기</a
          >
        </div>
      </div>

      <section v-if="post.imageUrls?.length" class="transfer-gallery mb-6 grid grid-cols-[2fr_1fr] gap-4">
        <img
          class="transfer-gallery-main h-[460px] w-full border border-neutral-200 object-cover"
          :src="post.imageUrls[0]"
          :alt="post.title"
        />
        <div v-if="post.imageUrls.length > 1" class="transfer-gallery-thumbs grid gap-4">
          <img
            v-for="imageUrl in post.imageUrls.slice(1)"
            :key="imageUrl"
            class="h-[140px] w-full border border-neutral-200 object-cover"
            :src="imageUrl"
            :alt="post.title"
          />
        </div>
      </section>

      <section class="split transfer-detail-layout grid grid-cols-2 gap-5">
        <article class="panel border border-neutral-200 bg-white p-6">
          <h2 class="text-[34px] font-black text-[#171717]">양도 조건</h2>
          <dl class="detail-grid mt-5 grid grid-cols-2 gap-4">
            <div class="border-b border-neutral-100 pb-3"><strong class="block text-xs font-black text-neutral-500">보증금</strong><span class="mt-1 block font-black">{{ formatMoney(post.depositAmount) }}</span></div>
            <div class="border-b border-neutral-100 pb-3"><strong class="block text-xs font-black text-neutral-500">월세</strong><span class="mt-1 block font-black">{{ formatMoney(post.monthlyRentAmount) }}</span></div>
            <div class="border-b border-neutral-100 pb-3"><strong class="block text-xs font-black text-neutral-500">관리비</strong><span class="mt-1 block font-black">{{ formatMoney(post.maintenanceFee) }}</span></div>
            <div class="border-b border-neutral-100 pb-3"><strong class="block text-xs font-black text-neutral-500">양도비</strong><span class="mt-1 block font-black">{{ formatMoney(post.transferFee) }}</span></div>
            <div class="border-b border-neutral-100 pb-3"><strong class="block text-xs font-black text-neutral-500">전용면적</strong><span class="mt-1 block font-black">{{ post.exclusiveArea || '-' }}㎡</span></div>
            <div class="border-b border-neutral-100 pb-3"><strong class="block text-xs font-black text-neutral-500">층수</strong><span class="mt-1 block font-black">{{ post.floor || '-' }}</span></div>
            <div class="border-b border-neutral-100 pb-3"><strong class="block text-xs font-black text-neutral-500">입주 가능일</strong><span class="mt-1 block font-black">{{ post.moveInDate || '-' }}</span></div>
            <div class="border-b border-neutral-100 pb-3"><strong class="block text-xs font-black text-neutral-500">계약 종료일</strong><span class="mt-1 block font-black">{{ post.contractEndDate || '-' }}</span></div>
          </dl>
        </article>

        <article class="panel border border-neutral-200 bg-white p-6">
          <h2 class="text-[34px] font-black text-[#171717]">상세 설명</h2>
          <p class="notice-body mt-5 whitespace-pre-wrap text-base font-bold leading-8 text-neutral-700">
            {{ post.content }}
          </p>
          <div class="contact-box mt-6 border border-neutral-200 bg-[#f7f4ef] p-5">
            <span class="text-xs font-black uppercase tracking-[0.14em] text-neutral-500">연락처</span>
            <strong class="mt-2 block text-2xl font-black">{{ post.contactPhone || '-' }}</strong>
          </div>
        </article>
      </section>
    </template>
  </main>
</template>
