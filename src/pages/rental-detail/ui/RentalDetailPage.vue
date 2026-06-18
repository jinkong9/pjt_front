<script setup>
import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { fetchRentalDetail } from '@/entities/rental/api/rentalApi'
import {
  evaluateRentalEligibility,
  readStoredMyDataProfile,
  validateMyDataProfile,
} from '@/entities/mydata/model/myDataProfile'
import EmptyState from '@/shared/ui/EmptyState.vue'
import LoadingState from '@/shared/ui/LoadingState.vue'

const route = useRoute()
const loading = ref(true)
const detail = ref(null)
const error = ref('')
const myDataProfile = ref(readStoredMyDataProfile())

const myDataErrors = computed(() => validateMyDataProfile(myDataProfile.value))
const hasMyData = computed(() => !Object.keys(myDataErrors.value).length)
const eligibility = computed(() =>
  hasMyData.value && detail.value ? evaluateRentalEligibility(myDataProfile.value, detail.value) : null,
)

function value(value) {
  return value || '-'
}

async function loadDetail(noticeId) {
  loading.value = true
  error.value = ''
  try {
    detail.value = await fetchRentalDetail(noticeId)
    document.title = `${detail.value.notice.title} | SSAFY Home`
  } catch {
    error.value = '공고 상세 정보를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

watch(
  () => route.params.noticeId,
  (noticeId) => loadDetail(noticeId),
  { immediate: true },
)
</script>

<template>
  <main class="shell page-shell mx-auto w-[min(1480px,calc(100%_-_48px))] py-24">
    <LoadingState v-if="loading" />
    <EmptyState v-else-if="error" :message="error" />
    <template v-else-if="detail">
      <RouterLink class="text-link text-sm font-black text-[#b4212a]" to="/rentals">목록으로</RouterLink>
      <div class="section-head mb-7 mt-5 flex flex-wrap items-start justify-between gap-5">
        <div class="max-w-5xl">
          <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
            Rental Detail
          </p>
          <h1 class="page-title mt-3 text-[clamp(28px,4vw,42px)] font-black leading-tight">
            {{ detail.notice.title }}
          </h1>
          <p class="muted mt-3 text-sm font-bold leading-7 text-neutral-500">
            {{ detail.notice.regionName }} · {{ detail.notice.noticeType }} · {{ detail.notice.detailType }} ·
            {{ detail.notice.status }}
          </p>
        </div>
        <a
          v-if="detail.notice.detailUrl"
          class="button primary inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white"
          :href="detail.notice.detailUrl"
          target="_blank"
          rel="noreferrer"
        >
          원문 보기
        </a>
      </div>

      <section class="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <article class="panel border border-neutral-200 bg-white p-6">
          <h2 class="text-2xl font-black text-[#171717]">공고 기본 정보</h2>
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
              <dd class="mt-1 font-black">{{ value(detail.detail.applyStartDate) }}</dd>
            </div>
            <div class="border-b border-neutral-100 pb-3">
              <dt class="text-xs font-black text-neutral-500">신청 마감</dt>
              <dd class="mt-1 font-black">{{ value(detail.detail.applyEndDate) }}</dd>
            </div>
            <div class="border-b border-neutral-100 pb-3">
              <dt class="text-xs font-black text-neutral-500">계약 장소</dt>
              <dd class="mt-1 font-black">{{ value(detail.detail.contractAddress) }}</dd>
            </div>
            <div class="border-b border-neutral-100 pb-3">
              <dt class="text-xs font-black text-neutral-500">문의</dt>
              <dd class="mt-1 font-black">{{ value(detail.detail.contact) }}</dd>
            </div>
          </dl>
        </article>

        <article class="panel border border-neutral-200 bg-white p-6">
          <h2 class="text-2xl font-black text-[#171717]">마이데이터 자격 확인</h2>
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
              마이데이터 입력 후 무주택, 소득, 자산, 희망 지역 기준을 바로 비교할 수 있습니다.
            </p>
            <RouterLink
              class="button primary mt-5 inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white"
              to="/mydata"
            >
              마이데이터 입력하러가기
            </RouterLink>
          </template>
        </article>
      </section>

      <section class="panel table-wrap mt-6 overflow-x-auto border border-neutral-200 bg-white p-6">
        <h2 class="mb-5 text-2xl font-black text-[#171717]">공급 정보</h2>
        <table class="table w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr>
              <th class="border-b border-neutral-200 px-0 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">용도</th>
              <th class="border-b border-neutral-200 px-0 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">공급 주소</th>
              <th class="border-b border-neutral-200 px-0 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">면적</th>
              <th class="border-b border-neutral-200 px-0 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">예상 금액</th>
              <th class="border-b border-neutral-200 px-0 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">주택형</th>
              <th class="border-b border-neutral-200 px-0 py-3 text-xs uppercase tracking-[0.14em] text-neutral-500">세대수</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(supply, index) in detail.supplies" :key="`${supply.address}-${index}`">
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
