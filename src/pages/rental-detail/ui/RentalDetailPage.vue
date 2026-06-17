<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchRentalDetail } from '@/entities/rental/api/rentalApi'
import LoadingState from '@/shared/ui/LoadingState.vue'

const route = useRoute()
const loading = ref(true)
const detail = ref(null)

onMounted(async () => {
  loading.value = true
  try {
    detail.value = await fetchRentalDetail(route.params.noticeId)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <main class="shell page-shell mx-auto w-[min(1480px,calc(100%_-_48px))] py-28">
    <LoadingState v-if="loading" />
    <template v-else-if="detail">
      <RouterLink class="text-link text-sm font-black text-[#b4212a]" to="/rentals">← 목록으로</RouterLink>
      <div class="section-head mb-8 mt-6 flex items-end justify-between gap-6">
        <div>
          <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
            Rental Detail
          </p>
          <h1 class="page-title mt-3 max-w-4xl text-[clamp(42px,6vw,76px)] font-black leading-none">
            {{ detail.notice.title }}
          </h1>
          <p class="muted mt-3 text-sm font-bold leading-7 text-neutral-500">
            {{ detail.notice.regionName }} · {{ detail.notice.status }}
          </p>
        </div>
        <a
          v-if="detail.notice.detailUrl"
          class="button primary inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white"
          :href="detail.notice.detailUrl"
          target="_blank"
        >
          원문 보기
        </a>
      </div>

      <section class="panel detail-grid grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 border border-neutral-200 bg-white p-6">
        <div class="border-b border-neutral-100 pb-3"><strong class="block text-xs font-black text-neutral-500">계약 장소</strong><span class="mt-1 block font-black">{{ detail.detail.contractAddress }}</span></div>
        <div class="border-b border-neutral-100 pb-3"><strong class="block text-xs font-black text-neutral-500">상세 주소</strong><span class="mt-1 block font-black">{{ detail.detail.contractDetailAddress }}</span></div>
        <div class="border-b border-neutral-100 pb-3"><strong class="block text-xs font-black text-neutral-500">접수 시작</strong><span class="mt-1 block font-black">{{ detail.detail.applyStartDate }}</span></div>
        <div class="border-b border-neutral-100 pb-3"><strong class="block text-xs font-black text-neutral-500">접수 마감</strong><span class="mt-1 block font-black">{{ detail.detail.applyEndDate }}</span></div>
        <div class="border-b border-neutral-100 pb-3"><strong class="block text-xs font-black text-neutral-500">문의</strong><span class="mt-1 block font-black">{{ detail.detail.contact }}</span></div>
      </section>

      <section class="panel table-wrap mt-6 overflow-x-auto border border-neutral-200 bg-white p-6">
        <h2 class="mb-5 text-[34px] font-black text-[#171717]">공급 정보</h2>
        <table class="table w-full border-collapse text-left">
          <thead>
            <tr>
              <th class="border-b border-neutral-200 px-0 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">유형</th>
              <th class="border-b border-neutral-200 px-0 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">위치</th>
              <th class="border-b border-neutral-200 px-0 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">면적</th>
              <th class="border-b border-neutral-200 px-0 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">임대조건</th>
              <th class="border-b border-neutral-200 px-0 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">주택형</th>
              <th class="border-b border-neutral-200 px-0 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">세대수</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="supply in detail.supplies" :key="`${supply.type}-${supply.location}`">
              <td class="border-b border-neutral-100 px-0 py-4 text-sm font-bold">{{ supply.usage }}</td>
              <td class="border-b border-neutral-100 px-0 py-4 text-sm font-bold">{{ supply.address }}</td>
              <td class="border-b border-neutral-100 px-0 py-4 text-sm font-bold">{{ supply.area }}</td>
              <td class="border-b border-neutral-100 px-0 py-4 text-sm font-bold">{{ supply.expectedAmount }}</td>
              <td class="border-b border-neutral-100 px-0 py-4 text-sm font-bold">{{ supply.houseType }}</td>
              <td class="border-b border-neutral-100 px-0 py-4 text-sm font-bold">{{ supply.householdCount }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </main>
</template>
