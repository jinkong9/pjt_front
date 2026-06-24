<script setup>
import { ref, watch } from 'vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { RouterLink } from 'vue-router'
import { api } from '@/shared/api/client'
import { getFinancialProfile } from '@/entities/member/api/financialProfileApi'
import { analyzePropertyLoan } from '@/entities/loan/api/loanAnalysisApi'
import { memberKeys } from '@/entities/member/model/memberQueries'
import {
  getHouseTradeLabel,
  getHouseTradePriceLabel,
} from '@/entities/house/model/houseTradeLabels'
import LoanAnalysisResult from './LoanAnalysisResult.vue'
import PropertyNeighborhoodAnalysis from './PropertyNeighborhoodAnalysis.vue'

const props = defineProps({
  trade: { type: Object, required: true },
  loggedIn: Boolean,
  initialTab: { type: String, default: 'detail' },
  loginRoute: { type: [String, Object], default: '/login' },
})
const emit = defineEmits(['close', 'tab-change'])
const queryClient = useQueryClient()

const activeTab = ref(props.initialTab === 'loan' ? 'loan' : 'detail')
const favorite = ref(false)
const profile = ref(null)
const profileLoaded = ref(false)
const analysis = ref(null)
const loading = ref(false)
const error = ref('')
const favoriteMutation = useMutation({
  mutationFn: () =>
    api.post(`/favorites/${props.trade.no}/toggle`).then((response) => response.data),
})
const financialProfileMutation = useMutation({
  mutationFn: getFinancialProfile,
  onSuccess: (data) => queryClient.setQueryData(memberKeys.financialProfile(), data),
})
const loanAnalysisMutation = useMutation({
  mutationFn: () =>
    analyzePropertyLoan({
      dealNo: props.trade.no,
      years: 30,
      rate: 4.2,
      repaymentType: 'EQUAL_PAYMENT',
    }),
})

watch(
  () => props.trade.no,
  () => {
    activeTab.value = props.initialTab === 'loan' ? 'loan' : 'detail'
    favorite.value = Boolean(props.trade.favorite)
    analysis.value = null
    error.value = ''
  },
  { immediate: true },
)

function openDetailTab() {
  activeTab.value = 'detail'
  emit('tab-change', 'detail')
}

async function toggleFavorite() {
  const data = await favoriteMutation.mutateAsync()
  favorite.value = data.favorite
}

async function openLoanTab() {
  activeTab.value = 'loan'
  emit('tab-change', 'loan')
  if (!props.loggedIn) return
  loading.value = true
  error.value = ''
  try {
    profile.value = await financialProfileMutation.mutateAsync()
    profileLoaded.value = true
    if (profile.value) await loadAnalysis()
  } catch (requestError) {
    if (requestError.response?.status === 204) {
      profile.value = null
      profileLoaded.value = true
    } else {
      error.value = '금융정보를 불러오지 못했습니다.'
    }
  } finally {
    loading.value = false
  }
}

async function loadAnalysis() {
  loading.value = true
  try {
    analysis.value = await loanAnalysisMutation.mutateAsync()
  } catch {
    error.value = '대출 분석 결과를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}

function tradeLabel(trade) {
  return getHouseTradeLabel(trade)
}

function tradePriceLabel(trade) {
  return getHouseTradePriceLabel(trade)
}

function hasTradeCoordinates(trade) {
  const latitude = Number(trade.latitude)
  const longitude = Number(trade.longitude)
  return (
    trade.latitude !== null &&
    trade.latitude !== undefined &&
    trade.latitude !== '' &&
    trade.longitude !== null &&
    trade.longitude !== undefined &&
    trade.longitude !== '' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude)
  )
}
</script>

<template>
  <aside
    data-testid="property-detail-panel"
    class="property-detail-panel relative z-40 flex w-full flex-col overflow-hidden bg-white shadow-2xl md:absolute md:bottom-0 md:left-0 md:top-20 md:border md:border-neutral-200"
  >
    <header class="border-b border-neutral-200 p-5">
      <div class="flex flex-col items-start justify-between gap-4 sm:flex-row">
        <div class="min-w-0">
          <p class="text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]">
            {{ tradeLabel(trade) }}
          </p>
          <h2 class="mt-2 text-2xl font-black">{{ trade.aptName }}</h2>
          <p class="mt-2 text-xs leading-5 text-neutral-500">{{ trade.address }}</p>
        </div>
        <div class="flex w-full flex-[0_0_auto] items-center gap-2 sm:w-auto">
          <button
            v-if="loggedIn"
            type="button"
            data-testid="property-favorite-toggle"
            class="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border px-3 text-xs font-black transition sm:flex-none"
            :class="
              favorite
                ? 'border-[#b4212a] bg-[#b4212a] text-white'
                : 'border-[#b4212a] bg-white text-[#b4212a] hover:bg-[#fff7f7]'
            "
            @click="toggleFavorite"
          >
            {{ favorite ? '관심중' : '관심' }}
          </button>
          <RouterLink
            v-else
            data-testid="property-login-link"
            :to="loginRoute"
            class="inline-flex min-h-10 flex-1 items-center justify-center rounded-xl border border-[#b4212a] bg-white px-3 text-xs font-black text-[#b4212a] hover:bg-[#fff7f7] sm:flex-none"
          >
            관심
          </RouterLink>
          <button
            data-testid="property-close"
            class="grid min-h-10 w-10 flex-[0_0_40px] place-items-center rounded-xl border border-[#d4d4d4] bg-white p-0 text-[#404040] hover:border-[#b4212a] hover:bg-[#fff7f7] hover:text-[#b4212a]"
            aria-label="상세 패널 닫기"
            @click="$emit('close')"
          >
            <span class="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
      </div>
      <nav class="mt-5 grid !grid-cols-2 gap-2">
        <button
          class="min-h-11 rounded-t-xl border border-neutral-200 bg-[#fafafa] px-4 text-sm font-black text-neutral-500 hover:border-[#d7a0a4] hover:bg-[#fff7f7] hover:text-[#b4212a]"
          :class="{
            'border-[#b4212a] bg-[#fff1f2] text-[#b4212a] shadow-[inset_0_-3px_0_#b4212a]':
              activeTab === 'detail',
          }"
          @click="openDetailTab"
        >
          상세정보
        </button>
        <button
          data-testid="loan-tab"
          class="min-h-11 rounded-t-xl border border-neutral-200 bg-[#fafafa] px-4 text-sm font-black text-neutral-500 hover:border-[#d7a0a4] hover:bg-[#fff7f7] hover:text-[#b4212a]"
          :class="{
            'border-[#b4212a] bg-[#fff1f2] text-[#b4212a] shadow-[inset_0_-3px_0_#b4212a]':
              activeTab === 'loan',
          }"
          @click="openLoanTab"
        >
          대출 계산
        </button>
      </nav>
    </header>

    <div class="flex-1 overflow-y-auto p-5">
      <section v-if="activeTab === 'detail'" class="space-y-5">
        <div class="bg-[#f7f4ef] p-5">
          <p class="text-xs font-black text-neutral-500">거래 가격</p>
          <strong class="mt-2 block text-3xl text-[#b4212a]">{{ tradePriceLabel(trade) }}</strong>
        </div>
        <dl class="grid grid-cols-1 gap-4 text-sm sm:!grid-cols-2">
          <div>
            <dt class="text-xs font-black text-neutral-500">전용면적</dt>
            <dd class="mt-1 font-bold">{{ trade.exclusiveArea }}㎡</dd>
          </div>
          <div>
            <dt class="text-xs font-black text-neutral-500">층</dt>
            <dd class="mt-1 font-bold">{{ trade.floor }}층</dd>
          </div>
          <div class="sm:col-span-2">
            <dt class="text-xs font-black text-neutral-500">거래일</dt>
            <dd class="mt-1 font-bold">{{ trade.dealDate }}</dd>
          </div>
        </dl>
        <PropertyNeighborhoodAnalysis :trade="trade" />
        <RouterLink
          v-if="hasTradeCoordinates(trade)"
          data-testid="property-analysis-link"
          class="block border border-neutral-300 px-4 py-3 text-center text-xs font-black"
          :to="{
            path: '/analysis',
            query: {
              label: trade.address,
              longitude: trade.longitude,
              latitude: trade.latitude,
              radius: 1000,
            },
          }"
          >생활권 분석 보기</RouterLink
        >
        <button
          v-else
          type="button"
          data-testid="property-analysis-disabled"
          class="block w-full cursor-not-allowed border border-neutral-200 bg-[#f7f4ef] px-4 py-3 text-center text-xs font-black text-neutral-400"
          disabled
        >
          좌표 확인 필요
        </button>
      </section>

      <section v-else>
        <div v-if="!loggedIn" class="border border-neutral-200 bg-[#f7f4ef] p-5">
          <h3 class="text-lg font-black">로그인 후 내 자산 기준 대출 분석을 확인하세요</h3>
          <RouterLink
            data-testid="property-login-link"
            :to="loginRoute"
            class="mt-4 block bg-[#b4212a] px-4 py-3 text-center text-sm font-black text-white"
            >로그인</RouterLink
          >
        </div>
        <p v-else-if="loading && !profileLoaded" class="text-sm font-bold text-neutral-500">
          금융정보를 불러오는 중입니다.
        </p>
        <div
          v-else-if="profileLoaded && !profile"
          class="border border-[#f0c9cc] bg-[linear-gradient(135deg,#fff8f8_0%,#f8eee8_100%)] p-5"
        >
          <p class="text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]">
            MyData Required
          </p>
          <h3 class="mt-2 text-xl font-black text-neutral-900">
            마이데이터를 입력하면 예상 월 납부액을 바로 계산할 수 있습니다.
          </h3>
          <p class="mt-2 text-xs font-bold leading-5 text-neutral-500">
            보유자산, 연소득, 월 저축액, 기존 대출 정보를 저장한 뒤 이 매물의 대출 분석 결과를
            확인하세요.
          </p>
          <RouterLink
            data-testid="mydata-link"
            to="/mydata"
            class="mt-4 block bg-[#b4212a] px-4 py-3 text-center text-sm font-black text-white"
          >
            마이데이터 입력하러 가기
          </RouterLink>
        </div>
        <LoanAnalysisResult v-else-if="analysis" :analysis="analysis" />
        <p v-if="error" class="mt-4 text-sm font-bold text-red-700">{{ error }}</p>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.property-detail-panel {
  box-sizing: border-box;
  max-width: none;
}

@media (min-width: 768px) {
  .property-detail-panel {
    top: var(--price-panel-top, 6rem);
    bottom: var(--price-panel-bottom, 1.5rem);
    left: calc(
      var(--price-panel-left, 1.5rem) + var(--price-panel-width, 520px) +
        var(--price-panel-gap, 0px)
    );
    width: var(--price-panel-width, 520px);
    max-width: none;
  }
}

.property-icon-button {
  display: grid;
  width: 40px;
  min-height: 40px;
  flex: 0 0 40px;
  place-items: center;
  border: 1px solid #d4d4d4;
  border-radius: 12px;
  background: #ffffff;
  color: #404040;
  padding: 0;
}

.property-icon-button:hover {
  border-color: #b4212a;
  background: #fff7f7;
  color: #b4212a;
}

.property-tab {
  min-height: 44px;
  border: 1px solid #e5e5e5;
  border-radius: 12px 12px 0 0;
  background: #fafafa;
  color: #737373;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 900;
}

.property-tab:hover {
  border-color: #d7a0a4;
  background: #fff7f7;
  color: #b4212a;
}

.property-tab-active {
  border-color: #b4212a;
  background: #fff1f2;
  color: #b4212a;
  box-shadow: inset 0 -3px 0 #b4212a;
}
</style>
