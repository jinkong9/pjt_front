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
  <main class="shell page-shell">
    <LoadingState v-if="loading" />
    <template v-else-if="detail">
      <RouterLink class="text-link" to="/rentals">← 목록으로</RouterLink>
      <div class="section-head">
        <div>
          <p class="eyebrow">Rental Detail</p>
          <h1 class="page-title">{{ detail.notice.title }}</h1>
          <p class="muted">{{ detail.notice.regionName }} · {{ detail.notice.status }}</p>
        </div>
        <a v-if="detail.notice.detailUrl" class="button primary" :href="detail.notice.detailUrl" target="_blank">
          원문 보기
        </a>
      </div>

      <section class="panel detail-grid">
        <div><strong>계약 장소</strong><span>{{ detail.detail.contractAddress }}</span></div>
        <div><strong>상세 주소</strong><span>{{ detail.detail.contractDetailAddress }}</span></div>
        <div><strong>접수 시작</strong><span>{{ detail.detail.applyStartDate }}</span></div>
        <div><strong>접수 마감</strong><span>{{ detail.detail.applyEndDate }}</span></div>
        <div><strong>문의</strong><span>{{ detail.detail.contact }}</span></div>
      </section>

      <section class="panel table-wrap">
        <h2>공급 정보</h2>
        <table class="table">
          <thead>
            <tr>
              <th>유형</th>
              <th>위치</th>
              <th>면적</th>
              <th>임대조건</th>
              <th>주택형</th>
              <th>세대수</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="supply in detail.supplies" :key="`${supply.type}-${supply.location}`">
              <td>{{ supply.usage }}</td>
              <td>{{ supply.address }}</td>
              <td>{{ supply.area }}</td>
              <td>{{ supply.expectedAmount }}</td>
              <td>{{ supply.houseType }}</td>
              <td>{{ supply.householdCount }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </template>
  </main>
</template>

