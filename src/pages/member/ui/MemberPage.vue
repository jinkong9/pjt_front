<script setup>
import { computed, onMounted, reactive, ref, watch, watchEffect } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { RouterLink, useRouter } from 'vue-router'
import { useMemberStore } from '@/entities/member/model/member'
import EmptyState from '@/shared/ui/EmptyState.vue'
import FinancialProfileForm from '@/features/property-detail/ui/FinancialProfileForm.vue'
import { saveFinancialProfile } from '@/entities/member/api/financialProfileApi'
import { memberKeys, memberQueryOptions } from '@/entities/member/model/memberQueries'
import {
  sendRentalRecommendationEmails,
  toggleFavoriteRentalNotice,
} from '@/entities/rental/api/rentalApi'
import { rentalKeys, rentalQueryOptions } from '@/entities/rental/model/rentalQueries'
import { transferQueryOptions } from '@/entities/transfer/model/transferQueries'
import {
  buildFinancialPayload,
  readStoredMyDataProfile,
  saveStoredMyDataProfile,
} from '@/entities/mydata/model/myDataProfile'
import { formatManwonToKoreanMoney } from '@/shared/lib/formatMoney'

const memberStore = useMemberStore()
const router = useRouter()
const queryClient = useQueryClient()
const ready = ref(false)
const rentalFavoritesLoaded = ref(false)
const transferFavoritesLoaded = ref(false)
const favoriteTab = ref('deals')
const message = ref('')
const passwordMessage = ref('')
const passwordError = ref('')
const passwordDialogOpen = ref(false)
const financialProfile = ref(null)
const myDataProfile = ref(null)
const financialSaving = ref(false)
const financialMessage = ref('')
const form = reactive({
  password: '',
  name: '',
  email: '',
  phone: '',
  rentalNoticeEmailEnabled: false,
})
const passwordForm = reactive({
  password: '',
  passwordConfirm: '',
})
const favoriteTabs = [
  { key: 'deals', label: '실거래' },
  { key: 'transfers', label: '양도' },
  { key: 'rentals', label: 'LH' },
]
const dealFavoritesQuery = useQuery({
  ...memberQueryOptions.dealFavorites(),
  enabled: () => memberStore.isLoggedIn,
})
const rentalFavoritesQuery = useQuery({
  ...rentalQueryOptions.favorites(),
  enabled: () => memberStore.isLoggedIn && favoriteTab.value === 'rentals',
})
const transferFavoritesQuery = useQuery({
  ...transferQueryOptions.favorites(),
  enabled: () => memberStore.isLoggedIn && favoriteTab.value === 'transfers',
})
const financialProfileQuery = useQuery({
  ...memberQueryOptions.financialProfile(),
  enabled: () => memberStore.isLoggedIn,
})
const financialProfileLoaded = computed(() =>
  !memberStore.isLoggedIn || financialProfileQuery.isFetched.value || financialProfileQuery.isError.value,
)
const removeRentalFavoriteMutation = useMutation({
  mutationFn: (noticeId) => toggleFavoriteRentalNotice(noticeId),
  onSuccess: (_result, noticeId) => {
    queryClient.setQueryData(rentalKeys.favorites(), (items = []) =>
      items.filter((item) => item.notice.rentalNoticeId !== noticeId),
    )
    queryClient.invalidateQueries({ queryKey: ['rentals', 'list'] })
    queryClient.invalidateQueries({ queryKey: ['rentals', 'recommendations'] })
  },
})
const recommendationEmailMutation = useMutation({
  mutationFn: sendRentalRecommendationEmails,
})
const favorites = computed(() => dealFavoritesQuery.data.value ?? [])
const rentalFavorites = computed(() => rentalFavoritesQuery.data.value ?? [])
const transferFavorites = computed(() => transferFavoritesQuery.data.value ?? [])
const rentalFavoritesLoading = computed(() => rentalFavoritesQuery.isPending.value)
const transferFavoritesLoading = computed(() => transferFavoritesQuery.isPending.value)

watchEffect(() => {
  if (memberStore.current) {
    form.name = memberStore.current.name
    form.email = memberStore.current.email
    form.phone = memberStore.current.phone
    form.rentalNoticeEmailEnabled = Boolean(memberStore.current.rentalNoticeEmailEnabled)
  }
})

async function removeRentalFavorite(noticeId) {
  await removeRentalFavoriteMutation.mutateAsync(noticeId)
}


async function updateMe() {
  message.value = ''
  await memberStore.update(form)
  form.password = ''
  message.value = '회원 정보가 수정되었습니다.'
}

function openPasswordDialog() {
  passwordError.value = ''
  passwordMessage.value = ''
  passwordForm.password = ''
  passwordForm.passwordConfirm = ''
  passwordDialogOpen.value = true
}

function closePasswordDialog() {
  passwordDialogOpen.value = false
  passwordError.value = ''
  passwordForm.password = ''
  passwordForm.passwordConfirm = ''
}

async function updatePassword() {
  passwordError.value = ''
  passwordMessage.value = ''
  if (!passwordForm.password || !passwordForm.passwordConfirm) {
    passwordError.value = '새 비밀번호와 비밀번호 확인을 입력해 주세요.'
    return
  }
  if (passwordForm.password !== passwordForm.passwordConfirm) {
    passwordError.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  await memberStore.update({
    ...form,
    password: passwordForm.password,
  })
  closePasswordDialog()
  passwordMessage.value = '비밀번호가 변경되었습니다.'
}

async function loadFinancialProfile() {
  financialProfile.value = financialProfileQuery.data.value
  myDataProfile.value = readStoredMyDataProfile()
}

async function updateFinancialProfile(payload = {}) {
  financialSaving.value = true
  financialMessage.value = ''
  try {
    const nextMyDataProfile = saveStoredMyDataProfile(payload.myDataProfile ?? {})
    myDataProfile.value = nextMyDataProfile
    financialProfile.value = await saveFinancialProfile(
      buildFinancialPayload(payload.financialProfile ?? nextMyDataProfile),
    )
    queryClient.invalidateQueries({ queryKey: memberKeys.financialProfile() })
    try {
      const emailResult = await recommendationEmailMutation.mutateAsync({
        desiredRegions: nextMyDataProfile.desiredRegions,
        rentalTypes: nextMyDataProfile.rentalTypes,
        limit: 5,
      })
      financialMessage.value =
        emailResult.sentCount > 0
          ? `금융 프로필이 저장되었습니다. 추천 공고 ${emailResult.sentCount}건을 메일로 보냈습니다.`
          : '금융 프로필이 저장되었습니다. 새로 보낼 추천 공고 메일은 없습니다.'
    } catch (emailError) {
      financialMessage.value =
        emailError?.response?.status === 403
          ? '금융 프로필은 저장되었습니다. LH 추천 메일을 받으려면 회원 정보에서 메일 수신 동의를 켜주세요.'
          : '금융 프로필은 저장되었습니다. LH 추천 메일은 보내지 못했습니다.'
    }
    financialMessage.value = '금융 프로필이 저장되었습니다.'
  } finally {
    financialSaving.value = false
  }
}

function formatMoney(value) {
  return formatManwonToKoreanMoney(value)
}

function favoriteDealRoute(deal) {
  return {
    path: '/prices',
    query: {
      mode: 'search',
      keyword: deal.aptName || deal.address || '',
      trade: deal.no,
      tab: 'detail',
    },
  }
}

onMounted(async () => {
  await memberStore.fetchMe()
  if (!memberStore.isLoggedIn) {
    window.alert('로그인이 필요합니다.')
    await router.replace('/login')
    return
  }
  await loadFinancialProfile()
  ready.value = true
})

watch(favoriteTab, (tab) => {
  if (tab === 'rentals' && memberStore.isLoggedIn && !rentalFavoritesLoaded.value) {
    rentalFavoritesLoaded.value = true
  }
  if (tab === 'transfers' && memberStore.isLoggedIn && !transferFavoritesLoaded.value) {
    transferFavoritesLoaded.value = true
  }
})

watch(financialProfileQuery.data, (profile) => {
  if (!profile) return
  financialProfile.value = profile
}, { immediate: true })
</script>

<template>
  <main v-if="ready" class="shell page-shell mx-auto w-[min(1480px,calc(100%_-_48px))] py-28">
    <section v-if="!memberStore.isLoggedIn" class="panel border border-neutral-200 bg-white p-6">
      <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">Member</p>
      <h1 class="page-title mt-3 max-w-4xl text-[clamp(42px,6vw,76px)] font-black leading-none">
        로그인이 필요합니다.
      </h1>
      <RouterLink
        class="button primary mt-6 inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white"
        to="/login"
      >
        로그인
      </RouterLink>
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

      <section class="split grid grid-cols-1 gap-5 lg:grid-cols-2">
        <article class="panel border border-neutral-200 bg-white p-6">
          <h2 class="text-[34px] font-black text-[#171717]">회원 정보 수정</h2>
          <p v-if="message" class="alert mt-4 border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-700">
            {{ message }}
          </p>
          <p v-if="passwordMessage" class="alert mt-4 border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-700">
            {{ passwordMessage }}
          </p>
          <form class="auth-form mt-5 grid gap-4" @submit.prevent="updateMe">
            <button
              type="button"
              data-testid="open-password-dialog"
              class="inline-flex min-h-12 items-center justify-center border border-neutral-300 bg-white px-4 text-sm font-black text-[#171717] hover:border-[#b4212a] hover:bg-[#fff7f7] hover:text-[#b4212a]"
              @click="openPasswordDialog"
            >
              비밀번호 변경
            </button>
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
            <label class="flex items-start gap-3 border border-neutral-200 bg-[#faf8f5] p-4 text-sm font-black">
              <input
                v-model="form.rentalNoticeEmailEnabled"
                data-testid="member-rental-email-consent"
                type="checkbox"
                class="mt-1 size-4 accent-[#b4212a]"
              />
              <span class="leading-6">
                LH 관심 공고 메일 수신 동의
                <small class="block text-xs font-bold text-neutral-500">
                  동의하면 관심 LH 공고 중 마감 3일 이내인 공고만 하루에 한 번 자동으로 알림을 받습니다.
                </small>
              </span>
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
            <div class="grid w-full grid-cols-3 border border-neutral-200 bg-white sm:w-auto">
              <button
                v-for="tab in favoriteTabs"
                :key="tab.key"
                type="button"
                :data-testid="`favorite-tab-${tab.key}`"
                class="min-h-10 border-r border-neutral-200 px-3 text-sm font-black transition last:border-r-0 sm:px-5"
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
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <strong class="block font-black">{{ deal.aptName }}</strong>
                    <span class="mt-1 block text-sm font-bold text-neutral-500">
                      {{ deal.address }} · {{ formatMoney(deal.dealAmount) }}
                    </span>
                  </div>
                  <RouterLink
                    :data-testid="`favorite-deal-detail-${deal.no}`"
                    class="inline-flex min-h-9 w-full items-center justify-center border border-[#b4212a] px-3 text-sm font-black text-[#b4212a] sm:w-auto"
                    :to="favoriteDealRoute(deal)"
                  >
                    상세 보기
                  </RouterLink>
                </div>
              </li>
            </ul>
          </template>
          <template v-else-if="favoriteTab === 'transfers'">
            <p v-if="transferFavoritesLoading" class="mt-5 text-sm font-black text-neutral-500">
              관심 양도 매물을 불러오는 중입니다.
            </p>
            <EmptyState
              v-else-if="!transferFavorites.length"
              message="저장한 관심 양도글이 없습니다."
            />
            <ul v-else class="clean-list mt-5 grid gap-4">
              <li
                v-for="transfer in transferFavorites"
                :key="transfer.transferId"
                class="border-b border-neutral-100 pb-4"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <strong class="block font-black">{{ transfer.title }}</strong>
                    <span class="mt-1 block text-sm font-bold text-neutral-500">
                      {{ transfer.address }} {{ transfer.detailAddress || '' }}
                    </span>
                    <span class="mt-2 block text-sm font-black text-neutral-700">
                      보증금 {{ formatMoney(transfer.depositAmount) }} ·
                      월세 {{ formatMoney(transfer.monthlyRentAmount) }} ·
                      양도비 {{ formatMoney(transfer.transferFee) }}
                    </span>
                  </div>
                  <RouterLink
                    :data-testid="`favorite-transfer-detail-${transfer.transferId}`"
                    class="inline-flex min-h-9 w-full items-center justify-center border border-[#b4212a] px-3 text-sm font-black text-[#b4212a] sm:w-auto"
                    :to="`/transfers/${transfer.transferId}`"
                  >
                    상세 보기
                  </RouterLink>
                </div>
              </li>
            </ul>
          </template>
          <template v-else>
            <div class="mt-5 border border-neutral-200 bg-[#faf8f5] p-4">
              <p class="text-sm font-black text-[#171717]">LH 관심 공고 메일 알림 설정</p>
              <p class="mt-2 text-sm font-bold leading-6 text-neutral-600">
                회원 정보 수정에서 수신 동의를 켜두면 관심 공고 중 마감 3일 이내인 공고만 하루에 한 번 자동으로 메일을 보냅니다.
              </p>
              <p class="mt-2 text-xs font-black text-[#b4212a]">
                현재 상태: {{ memberStore.current?.rentalNoticeEmailEnabled ? '수신 동의' : '수신 미동의' }}
              </p>
            </div>
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
                  <div class="flex w-full flex-wrap gap-2 sm:w-auto">
                    <RouterLink
                      class="inline-flex min-h-9 flex-1 items-center justify-center border border-[#b4212a] px-3 text-sm font-black text-[#b4212a] sm:flex-none"
                      :to="`/rentals/${item.notice.rentalNoticeId}`"
                    >
                      상세 보기
                    </RouterLink>
                    <button
                      type="button"
                      :data-testid="`remove-rental-favorite-${item.notice.rentalNoticeId}`"
                      class="inline-flex min-h-9 flex-1 items-center justify-center border border-[#b4212a] bg-white px-3 text-sm font-black text-[#b4212a] hover:bg-[#fff7f7] sm:flex-none"
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

      <div
        v-if="passwordDialogOpen"
        class="fixed inset-0 z-50 grid place-items-center bg-black/45 px-4"
        data-testid="password-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-dialog-title"
      >
        <form
          class="w-[min(420px,100%)] border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)]"
          data-testid="password-dialog-form"
          @submit.prevent="updatePassword"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <p class="m-0 text-xs font-black uppercase tracking-[0.24em] text-[#b4212a]">Password</p>
              <h3 id="password-dialog-title" class="mt-2 text-2xl font-black text-[#171717]">비밀번호 변경</h3>
            </div>
            <button
              type="button"
              class="grid min-h-9 w-9 place-items-center border border-neutral-200 bg-white text-sm font-black text-neutral-500 hover:border-[#b4212a] hover:text-[#b4212a]"
              aria-label="비밀번호 변경 닫기"
              @click="closePasswordDialog"
            >
              X
            </button>
          </div>
          <p v-if="passwordError" class="mt-4 border border-red-200 bg-red-50 p-3 text-sm font-black text-red-700">
            {{ passwordError }}
          </p>
          <div class="mt-5 grid gap-4">
            <label class="grid gap-2 text-sm font-black">
              새 비밀번호
              <input
                v-model="passwordForm.password"
                data-testid="password-new"
                class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0 focus:border-[#b4212a]"
                type="password"
                required
              />
            </label>
            <label class="grid gap-2 text-sm font-black">
              비밀번호 확인
              <input
                v-model="passwordForm.passwordConfirm"
                data-testid="password-confirm"
                class="min-h-12 w-full border border-neutral-200 bg-white px-3 text-[15px] font-extrabold outline-0 focus:border-[#b4212a]"
                type="password"
                required
              />
            </label>
          </div>
          <div class="mt-6 grid grid-cols-2 gap-2">
            <button
              type="button"
              class="inline-flex min-h-11 items-center justify-center border border-neutral-300 bg-white px-4 text-sm font-black text-neutral-600"
              @click="closePasswordDialog"
            >
              취소
            </button>
            <button
              type="submit"
              class="inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-4 text-sm font-black text-white"
            >
              변경하기
            </button>
          </div>
        </form>
      </div>

      <section v-if="financialProfileLoaded" class="panel mt-6 border border-neutral-200 bg-white p-6">
        <div>
          <h2 class="text-[34px] font-black text-[#171717]">금융 프로필</h2>
          <p class="muted mt-2 text-sm font-bold leading-7 text-neutral-500">
            실거래 지도와 대출 계산에 사용할 자산과 상환 정보를 관리합니다.
          </p>
        </div>
        <p v-if="financialMessage" class="alert mt-4 border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-700">
          {{ financialMessage }}
        </p>
        <div class="mt-5">
          <FinancialProfileForm
            :initial-value="financialProfile"
            :initial-my-data="myDataProfile"
            :saving="financialSaving"
            @save="updateFinancialProfile"
          />
        </div>
      </section>
    </template>
  </main>
</template>
