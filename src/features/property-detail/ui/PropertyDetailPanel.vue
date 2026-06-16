<script setup>
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/shared/api/client'
import {
  getFinancialProfile,
  saveFinancialProfile,
} from '@/entities/member/api/financialProfileApi'
import { analyzePropertyLoan } from '@/entities/loan/api/loanAnalysisApi'
import FinancialProfileForm from './FinancialProfileForm.vue'
import LoanAnalysisResult from './LoanAnalysisResult.vue'
import PropertyNeighborhoodAnalysis from './PropertyNeighborhoodAnalysis.vue'

const props = defineProps({
  trade: { type: Object, required: true },
  loggedIn: Boolean,
  initialTab: { type: String, default: 'detail' },
  loginRoute: { type: [String, Object], default: '/login' },
})
const emit = defineEmits(['close', 'tab-change'])

const activeTab = ref(props.initialTab === 'loan' ? 'loan' : 'detail')
const favorite = ref(false)
const profile = ref(null)
const profileLoaded = ref(false)
const analysis = ref(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')

watch(
  () => props.trade.no,
  () => {
    activeTab.value = props.initialTab === 'loan' ? 'loan' : 'detail'
    analysis.value = null
    error.value = ''
  },
)

function openDetailTab() {
  activeTab.value = 'detail'
  emit('tab-change', 'detail')
}

async function toggleFavorite() {
  const { data } = await api.post(`/favorites/${props.trade.no}/toggle`)
  favorite.value = data.favorite
}

async function openLoanTab() {
  activeTab.value = 'loan'
  emit('tab-change', 'loan')
  if (!props.loggedIn) return
  loading.value = true
  error.value = ''
  try {
    profile.value = await getFinancialProfile()
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

async function saveProfile(payload) {
  saving.value = true
  error.value = ''
  try {
    profile.value = await saveFinancialProfile(payload)
    profileLoaded.value = true
    await loadAnalysis()
  } catch {
    error.value = '금융정보를 저장하지 못했습니다.'
  } finally {
    saving.value = false
  }
}

async function loadAnalysis() {
  loading.value = true
  try {
    analysis.value = await analyzePropertyLoan({
      dealNo: props.trade.no,
      years: 30,
      rate: 4.2,
      repaymentType: 'EQUAL_PAYMENT',
    })
  } catch {
    error.value = '대출 분석 결과를 불러오지 못했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <aside
    data-testid="property-detail-panel"
    class="property-detail-panel absolute bottom-0 left-0 top-20 z-40 flex w-full flex-col overflow-hidden bg-white shadow-2xl md:border md:border-neutral-200"
  >
    <header class="border-b border-neutral-200 p-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]">APT SALE</p>
          <h2 class="mt-2 text-2xl font-black">{{ trade.aptName }}</h2>
          <p class="mt-2 text-xs leading-5 text-neutral-500">{{ trade.address }}</p>
        </div>
        <button
          data-testid="property-close"
          class="property-icon-button"
          aria-label="상세 패널 닫기"
          @click="$emit('close')"
        >
          <span class="material-symbols-outlined text-lg">close</span>
        </button>
      </div>
      <nav class="mt-5 grid grid-cols-2 gap-2">
        <button
          class="property-tab"
          :class="{ 'property-tab-active': activeTab === 'detail' }"
          @click="openDetailTab"
        >
          상세정보
        </button>
        <button
          data-testid="loan-tab"
          class="property-tab"
          :class="{ 'property-tab-active': activeTab === 'loan' }"
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
          <strong class="mt-2 block text-3xl text-[#b4212a]">{{ trade.dealAmount }}만원</strong>
        </div>
        <dl class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt class="text-xs font-black text-neutral-500">전용면적</dt>
            <dd class="mt-1 font-bold">{{ trade.exclusiveArea }}㎡</dd>
          </div>
          <div>
            <dt class="text-xs font-black text-neutral-500">층</dt>
            <dd class="mt-1 font-bold">{{ trade.floor }}층</dd>
          </div>
          <div class="col-span-2">
            <dt class="text-xs font-black text-neutral-500">거래일</dt>
            <dd class="mt-1 font-bold">{{ trade.dealDate }}</dd>
          </div>
        </dl>
        <PropertyNeighborhoodAnalysis :trade="trade" />
        <RouterLink
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
          v-if="loggedIn"
          class="w-full bg-[#b4212a] px-4 py-3 text-sm font-black text-white"
          @click="toggleFavorite"
        >
          {{ favorite ? '관심 매물 해제' : '관심 매물 등록' }}
        </button>
        <RouterLink
          v-else
          data-testid="property-login-link"
          :to="loginRoute"
          class="block w-full bg-[#b4212a] px-4 py-3 text-center text-sm font-black text-white"
          >로그인하고 관심 매물 등록</RouterLink
        >
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
        <FinancialProfileForm
          v-else-if="profileLoaded && !profile"
          :saving="saving"
          @save="saveProfile"
        />
        <LoanAnalysisResult v-else-if="analysis" :analysis="analysis" />
        <p v-if="error" class="mt-4 text-sm font-bold text-red-700">{{ error }}</p>
      </section>
    </div>
  </aside>
</template>

<style scoped>
.property-detail-panel {
  max-width: var(--price-panel-width, 520px);
}

@media (min-width: 768px) {
  .property-detail-panel {
    top: 6rem;
    bottom: 1.5rem;
    left: calc(1.5rem + var(--price-panel-width, 520px));
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
