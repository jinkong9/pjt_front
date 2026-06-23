<script setup>
import { onMounted, reactive, ref, watch, watchEffect } from 'vue'
import { RouterLink } from 'vue-router'
import { api } from '@/shared/api/client'
import { useMemberStore } from '@/entities/member/model/member'
import EmptyState from '@/shared/ui/EmptyState.vue'
import FinancialProfileForm from '@/features/property-detail/ui/FinancialProfileForm.vue'
import { getFinancialProfile, saveFinancialProfile } from '@/entities/member/api/financialProfileApi'
import {
  fetchFavoriteRentalNotices,
  sendFavoriteRentalNoticeEmails,
  toggleFavoriteRentalNotice,
} from '@/entities/rental/api/rentalApi'

const memberStore = useMemberStore()
const favorites = ref([])
const rentalFavorites = ref([])
const rentalFavoritesLoaded = ref(false)
const rentalFavoritesLoading = ref(false)
const favoriteTab = ref('deals')
const message = ref('')
const rentalEmailMessage = ref('')
const rentalEmailResult = ref(null)
const rentalEmailSending = ref(false)
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

async function loadRentalFavorites() {
  if (rentalFavoritesLoading.value) return
  rentalFavoritesLoading.value = true
  try {
    rentalFavorites.value = await fetchFavoriteRentalNotices()
    rentalFavoritesLoaded.value = true
  } catch {
    rentalFavorites.value = []
    rentalFavoritesLoaded.value = true
  } finally {
    rentalFavoritesLoading.value = false
  }
}

async function removeRentalFavorite(noticeId) {
  await toggleFavoriteRentalNotice(noticeId)
  rentalFavorites.value = rentalFavorites.value.filter(
    (item) => item.notice.rentalNoticeId !== noticeId,
  )
}

function rentalEmailResultMessage(result) {
  if (result.sentCount > 0) {
    return `${result.sentCount}건의 LH 관심 공고 알림을 발송했습니다.`
  }
  return '새로 보낼 알림이 없습니다. 이미 발송했거나 접수 기간 조건에 맞지 않습니다.'
}

async function sendRentalEmails() {
  rentalEmailSending.value = true
  rentalEmailMessage.value = ''
  rentalEmailResult.value = null
  try {
    const result = await sendFavoriteRentalNoticeEmails()
    rentalEmailResult.value = result
    rentalEmailMessage.value = rentalEmailResultMessage(result)
  } finally {
    rentalEmailSending.value = false
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
    if (favoriteTab.value === 'rentals') {
      await loadRentalFavorites()
    }
  }
})

watch(favoriteTab, (tab) => {
  if (tab === 'rentals' && memberStore.isLoggedIn && !rentalFavoritesLoaded.value) {
    loadRentalFavorites()
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
          <template v-else>
            <div class="mt-5 flex flex-wrap items-center justify-between gap-3 border border-neutral-200 bg-[#faf8f5] p-4">
              <p class="text-sm font-bold text-neutral-600">
                운영 자동 발송은 서버 스케줄러가 처리합니다. 이 버튼은 현재 관심 공고 알림을 수동으로 확인합니다.
              </p>
              <button
                type="button"
                data-testid="send-rental-favorite-emails"
                class="inline-flex min-h-10 items-center justify-center border border-[#171717] bg-[#171717] px-4 text-sm font-black text-white disabled:cursor-wait disabled:opacity-60"
                :disabled="rentalEmailSending"
                @click="sendRentalEmails"
              >
                관심 공고 알림 메일 보내기
              </button>
            </div>
            <p
              v-if="rentalEmailMessage"
              class="mt-3 border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-700"
            >
              {{ rentalEmailMessage }}
              <span v-if="rentalEmailResult" class="mt-1 block text-xs text-emerald-800">
                발송 {{ rentalEmailResult.sentCount ?? 0 }}건 · 보류 {{ rentalEmailResult.skippedCount ?? 0 }}건 ·
                이메일 없음 {{ rentalEmailResult.missingMemberCount ?? 0 }}건
                <span class="mt-1 block">
                  보류는 이미 발송했거나 접수 기간 조건에 맞지 않는 공고입니다.
                </span>
              </span>
            </p>
            <p v-if="rentalFavoritesLoading" class="mt-5 text-sm font-black text-neutral-500">
              LH 관심 공고를 불러오는 중입니다.
            </p>
            <EmptyState
              v-else-if="!rentalFavorites.length"
              message="저장한 관심 LH 공고가 없습니다."
            />
            <ul v-else class="clean-list mt-5 grid gap-4">
              <li
                v-for="item in rentalFavorites"
                :key="item.notice.rentalNoticeId"
                class="border-b border-neutral-100 pb-4"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <strong class="block font-black">{{ item.notice.title }}</strong>
                    <span class="mt-1 block text-sm font-bold text-neutral-500">
                      {{ item.notice.regionName }} · {{ item.notice.status || '공고' }} ·
                      {{ item.notice.applicationPeriod || item.notice.closeDate || '-' }}
                    </span>
                  </div>
                  <div class="flex gap-2">
                    <RouterLink
                      class="inline-flex min-h-9 items-center justify-center border border-[#b4212a] px-3 text-sm font-black text-[#b4212a]"
                      :to="`/rentals/${item.notice.rentalNoticeId}`"
                    >
                      상세 보기
                    </RouterLink>
                    <button
                      type="button"
                      :data-testid="`remove-rental-favorite-${item.notice.rentalNoticeId}`"
                      class="inline-flex min-h-9 items-center justify-center border border-[#b4212a] bg-white px-3 text-sm font-black text-[#b4212a] hover:bg-[#fff7f7]"
                      @click="removeRentalFavorite(item.notice.rentalNoticeId)"
                    >
                      해제
                    </button>
                  </div>
                </div>
              </li>
            </ul>
          </template>
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
