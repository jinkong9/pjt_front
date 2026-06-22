<script setup>
import { onMounted, reactive, ref, watchEffect } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/shared/api/client'
import { useMemberStore } from '@/entities/member/model/member'
import EmptyState from '@/shared/ui/EmptyState.vue'
import FinancialProfileForm from '@/features/property-detail/ui/FinancialProfileForm.vue'
import { getFinancialProfile, saveFinancialProfile } from '@/entities/member/api/financialProfileApi'

const memberStore = useMemberStore()
const favorites = ref([])
const favoriteTab = ref('deals')
const message = ref('')
const financialProfile = ref(null)
const financialProfileLoaded = ref(false)
const financialSaving = ref(false)
const financialMessage = ref('')
const form = reactive({
  password: '',
  name: '',
  email: '',
  phone: '',
})
const favoriteTabs = [
  { key: 'deals', label: '실거래' },
  { key: 'transfers', label: '양도' },
  { key: 'rentals', label: 'LH' },
]

watchEffect(() => {
  if (memberStore.current) {
    form.name = memberStore.current.name
    form.email = memberStore.current.email
    form.phone = memberStore.current.phone
  }
})

async function loadFavorites() {
  try {
    const { data } = await api.get('/favorites')
    favorites.value = data
  } catch {
    favorites.value = []
  }
}

async function updateMe() {
  message.value = ''
  await memberStore.update(form)
  form.password = ''
  message.value = '회원 정보가 수정되었습니다.'
}

async function loadFinancialProfile() {
  try {
    financialProfile.value = await getFinancialProfile()
  } catch (error) {
    if (error.response?.status !== 204) {
      financialMessage.value = '금융 프로필을 불러오지 못했습니다.'
    }
  } finally {
    financialProfileLoaded.value = true
  }
}

async function updateFinancialProfile(payload) {
  financialSaving.value = true
  financialMessage.value = ''
  try {
    financialProfile.value = await saveFinancialProfile(payload)
    financialMessage.value = '금융 프로필이 저장되었습니다.'
  } finally {
    financialSaving.value = false
  }
}

function formatMoney(value) {
  const number = Number(String(value ?? '').replace(/[^\d.-]/g, ''))
  if (!Number.isFinite(number)) return value ?? '-'
  return number.toLocaleString('ko-KR')
}

onMounted(async () => {
  await memberStore.fetchMe()
  if (memberStore.isLoggedIn) {
    await Promise.all([loadFavorites(), loadFinancialProfile()])
  }
})
</script>

<template>
  <main class="shell page-shell mx-auto w-[min(1480px,calc(100%_-_48px))] py-28">
    <section v-if="!memberStore.isLoggedIn" class="panel border border-neutral-200 bg-white p-6">
      <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">Member</p>
      <h1 class="page-title mt-3 max-w-4xl text-[clamp(42px,6vw,76px)] font-black leading-none">
        로그인이 필요합니다
      </h1>
      <RouterLink
        class="button primary mt-6 inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white"
        to="/login"
        >로그인</RouterLink
      >
    </section>

    <template v-else>
      <div class="section-head mb-8 flex items-end justify-between gap-6">
        <div>
          <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">My Page</p>
          <h1 class="page-title mt-3 max-w-4xl text-[clamp(42px,6vw,76px)] font-black leading-none">
            {{ memberStore.current.name }}님
          </h1>
          <p class="muted mt-3 text-sm font-bold leading-7 text-neutral-500">
            {{ memberStore.current.email }} · {{ memberStore.current.phone }}
          </p>
        </div>
      </div>

      <section class="split grid grid-cols-2 gap-5">
        <article class="panel border border-neutral-200 bg-white p-6">
          <h2 class="text-[34px] font-black text-[#171717]">회원 정보 수정</h2>
          <p v-if="message" class="alert mt-4 border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-700">
            {{ message }}
          </p>
          <form class="auth-form mt-5 grid gap-4" @submit.prevent="updateMe">
            <label class="grid gap-2 text-sm font-black"
              >새 비밀번호
              <input
                v-model="form.password"
                class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0"
                type="password"
                placeholder="변경 시 입력"
              />
            </label>
            <label class="grid gap-2 text-sm font-black"
              >이름
              <input v-model="form.name" class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0" required />
            </label>
            <label class="grid gap-2 text-sm font-black"
              >이메일
              <input v-model="form.email" class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0" type="email" required />
            </label>
            <label class="grid gap-2 text-sm font-black"
              >전화번호
              <input v-model="form.phone" class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0" required />
            </label>
            <button
              type="submit"
              class="inline-flex min-h-11 items-center justify-center border border-[#171717] bg-[#171717] px-[18px] font-black text-white"
            >
              수정하기
            </button>
          </form>
        </article>

        <article class="panel border border-neutral-200 bg-white p-6">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <h2 class="text-[34px] font-black text-[#171717]">관심 목록</h2>
            <div class="grid grid-cols-3 border border-neutral-200 bg-white">
              <button
                v-for="tab in favoriteTabs"
                :key="tab.key"
                type="button"
                :data-testid="`favorite-tab-${tab.key}`"
                class="min-h-10 border-r border-neutral-200 px-5 text-sm font-black transition last:border-r-0"
                :class="
                  favoriteTab === tab.key
                    ? 'bg-[#f7f4ef] text-[#b4212a]'
                    : 'bg-white text-neutral-600 hover:bg-[#faf8f5] hover:text-[#171717]'
                "
                @click="favoriteTab = tab.key"
              >
                {{ tab.label }}
              </button>
            </div>
          </div>

          <template v-if="favoriteTab === 'deals'">
            <EmptyState v-if="!favorites.length" message="저장한 관심 실거래가 없습니다." />
            <ul v-else class="clean-list mt-5 grid gap-4">
              <li v-for="deal in favorites" :key="deal.no" class="border-b border-neutral-100 pb-4">
                <strong class="block font-black">{{ deal.aptName }}</strong>
                <span class="mt-1 block text-sm font-bold text-neutral-500">
                  {{ deal.address }} · {{ formatMoney(deal.dealAmount) }}만원
                </span>
              </li>
            </ul>
          </template>
          <EmptyState v-else-if="favoriteTab === 'transfers'" message="저장한 관심 양도글이 없습니다." />
          <EmptyState v-else message="저장한 관심 LH 공고가 없습니다." />
        </article>
      </section>

      <section v-if="financialProfileLoaded" class="panel mt-6 border border-neutral-200 bg-white p-6">
        <h2 class="text-[34px] font-black text-[#171717]">금융 프로필</h2>
        <p class="muted mt-2 text-sm font-bold leading-7 text-neutral-500">
          실거래 지도 대출 계산에 사용할 자산과 상환 정보를 관리합니다.
        </p>
        <p v-if="financialMessage" class="alert mt-4 border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-700">
          {{ financialMessage }}
        </p>
        <div class="mt-5 max-w-xl">
          <FinancialProfileForm
            :initial-value="financialProfile"
            :saving="financialSaving"
            @save="updateFinancialProfile"
          />
        </div>
      </section>
    </template>
  </main>
</template>
