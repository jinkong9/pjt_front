<script setup>
import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/shared/api/client'
import { getFinancialProfile, saveFinancialProfile } from '@/entities/member/api/financialProfileApi'
import { analyzePropertyLoan } from '@/entities/loan/api/loanAnalysisApi'
import FinancialProfileForm from './FinancialProfileForm.vue'
import LoanAnalysisResult from './LoanAnalysisResult.vue'

const props = defineProps({
  trade: { type: Object, required: true },
  loggedIn: Boolean,
})
defineEmits(['close'])

const activeTab = ref('detail')
const favorite = ref(false)
const profile = ref(null)
const profileLoaded = ref(false)
const analysis = ref(null)
const loading = ref(false)
const saving = ref(false)
const error = ref('')

watch(() => props.trade.no, () => {
  activeTab.value = 'detail'
  analysis.value = null
  error.value = ''
})

async function toggleFavorite() {
  const { data } = await api.post(`/favorites/${props.trade.no}/toggle`)
  favorite.value = data.favorite
}

async function openLoanTab() {
  activeTab.value = 'loan'
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
    class="absolute bottom-0 left-0 top-20 z-40 flex w-full flex-col overflow-hidden bg-white shadow-2xl md:bottom-6 md:left-[568px] md:top-24 md:w-[430px] md:border md:border-neutral-200"
  >
    <header class="border-b border-neutral-200 p-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]">APT SALE</p>
          <h2 class="mt-2 text-2xl font-black">{{ trade.aptName }}</h2>
          <p class="mt-2 text-xs leading-5 text-neutral-500">{{ trade.address }}</p>
        </div>
        <button class="grid h-9 w-9 place-items-center border border-neutral-300 font-black" @click="$emit('close')">X</button>
      </div>
      <nav class="mt-5 grid grid-cols-2 border-b border-neutral-200">
        <button class="pb-3 text-sm font-black" :class="activeTab === 'detail' ? 'border-b-2 border-[#b4212a] text-[#b4212a]' : 'text-neutral-500'" @click="activeTab = 'detail'">상세정보</button>
        <button data-testid="loan-tab" class="pb-3 text-sm font-black" :class="activeTab === 'loan' ? 'border-b-2 border-[#b4212a] text-[#b4212a]' : 'text-neutral-500'" @click="openLoanTab">대출 계산</button>
      </nav>
    </header>

    <div class="flex-1 overflow-y-auto p-5">
      <section v-if="activeTab === 'detail'" class="space-y-5">
        <div class="bg-[#f7f4ef] p-5">
          <p class="text-xs font-black text-neutral-500">거래 가격</p>
          <strong class="mt-2 block text-3xl text-[#b4212a]">{{ trade.dealAmount }}만원</strong>
        </div>
        <dl class="grid grid-cols-2 gap-4 text-sm">
          <div><dt class="text-xs font-black text-neutral-500">전용면적</dt><dd class="mt-1 font-bold">{{ trade.exclusiveArea }}㎡</dd></div>
          <div><dt class="text-xs font-black text-neutral-500">층</dt><dd class="mt-1 font-bold">{{ trade.floor }}층</dd></div>
          <div class="col-span-2"><dt class="text-xs font-black text-neutral-500">거래일</dt><dd class="mt-1 font-bold">{{ trade.dealDate }}</dd></div>
        </dl>
        <RouterLink class="block border border-neutral-300 px-4 py-3 text-center text-xs font-black" :to="{ path: '/analysis', query: { label: trade.address, longitude: trade.longitude, latitude: trade.latitude, radius: 1000 } }">생활권 분석 보기</RouterLink>
        <button v-if="loggedIn" class="w-full bg-[#b4212a] px-4 py-3 text-sm font-black text-white" @click="toggleFavorite">
          {{ favorite ? '관심 매물 해제' : '관심 매물 등록' }}
        </button>
        <RouterLink v-else to="/login" class="block w-full bg-[#b4212a] px-4 py-3 text-center text-sm font-black text-white">로그인하고 관심 매물 등록</RouterLink>
      </section>

      <section v-else>
        <div v-if="!loggedIn" class="border border-neutral-200 bg-[#f7f4ef] p-5">
          <h3 class="text-lg font-black">로그인 후 내 자산 기준 대출 분석을 확인하세요</h3>
          <RouterLink to="/login" class="mt-4 block bg-[#b4212a] px-4 py-3 text-center text-sm font-black text-white">로그인</RouterLink>
        </div>
        <p v-else-if="loading && !profileLoaded" class="text-sm font-bold text-neutral-500">금융정보를 불러오는 중입니다.</p>
        <FinancialProfileForm v-else-if="profileLoaded && !profile" :saving="saving" @save="saveProfile" />
        <LoanAnalysisResult v-else-if="analysis" :analysis="analysis" />
        <p v-if="error" class="mt-4 text-sm font-bold text-red-700">{{ error }}</p>
      </section>
    </div>
  </aside>
</template>
