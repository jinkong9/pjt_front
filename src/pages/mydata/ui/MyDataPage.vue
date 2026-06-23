<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { RouterLink } from 'vue-router'
import { useMemberStore } from '@/entities/member/model/member'
import { saveFinancialProfile } from '@/entities/member/api/financialProfileApi'
import { memberKeys, memberQueryOptions } from '@/entities/member/model/memberQueries'
import {
  buildFinancialPayload,
  normalizeMyDataProfile,
  readStoredMyDataProfile,
  saveStoredMyDataProfile,
  validateMyDataProfile,
} from '@/entities/mydata/model/myDataProfile'

const memberStore = useMemberStore()
const queryClient = useQueryClient()
const loaded = ref(false)
const message = ref('')
const error = ref('')
const form = reactive(normalizeMyDataProfile())
const validationErrors = ref({})
const regionInput = ref('')
const financialProfileQuery = useQuery({
  ...memberQueryOptions.financialProfile(),
  enabled: () => memberStore.isLoggedIn,
})
const saveFinancialMutation = useMutation({
  mutationFn: saveFinancialProfile,
  onSuccess: (profile) => {
    queryClient.setQueryData(memberKeys.financialProfile(), profile)
  },
})
const saving = computed(() => saveFinancialMutation.isPending.value)

const completion = computed(() => {
  const requiredFields = ['birthDate', 'householdMembers', 'isHomeless', 'annualIncome', 'totalAssets']
  const completed = requiredFields.filter((field) => form[field] !== undefined && form[field] !== null && form[field] !== '').length
  return Math.round(((completed + (form.desiredRegions.length ? 1 : 0)) / 6) * 100)
})

function applyProfile(profile) {
  Object.assign(form, normalizeMyDataProfile(profile))
}

function addRegion() {
  const nextRegion = regionInput.value.trim()
  if (!nextRegion || form.desiredRegions.includes(nextRegion)) return
  form.desiredRegions.push(nextRegion)
  regionInput.value = ''
}

function removeRegion(region) {
  form.desiredRegions = form.desiredRegions.filter((item) => item !== region)
}

function toggleRentalType(type) {
  form.rentalTypes = form.rentalTypes.includes(type)
    ? form.rentalTypes.filter((item) => item !== type)
    : [...form.rentalTypes, type]
}

async function loadMyData() {
  applyProfile(readStoredMyDataProfile())

  try {
    const { data: financialProfile } = await financialProfileQuery.refetch()
    if (financialProfile) {
      applyProfile({ ...form, ...financialProfile })
    }
  } catch (requestError) {
    if (requestError.response?.status !== 204) {
      error.value = '저장된 마이데이터를 불러오지 못했습니다.'
    }
  } finally {
    loaded.value = true
  }
}

async function saveMyData() {
  validationErrors.value = validateMyDataProfile(form)
  message.value = ''
  error.value = ''

  if (Object.keys(validationErrors.value).length) {
    error.value = '필수 항목을 확인해 주세요.'
    return
  }

  try {
    const storedProfile = saveStoredMyDataProfile({ ...form })
    const financialProfile = await saveFinancialMutation.mutateAsync(buildFinancialPayload(storedProfile))
    applyProfile({ ...storedProfile, ...financialProfile })
    message.value = '마이데이터가 저장되었습니다.'
  } catch {
    error.value = '마이데이터를 저장하지 못했습니다.'
  }
}

function startWizard() {
  form.inputMode = 'wizard'
  if (!form.maritalStatus) form.maritalStatus = 'single'
  if (!form.isHomeless) form.isHomeless = 'yes'
  if (!form.isHouseholdHead) form.isHouseholdHead = 'unknown'
}

onMounted(async () => {
  document.title = '마이데이터 | SSAFY Home'
  if (!memberStore.loaded) {
    await memberStore.fetchMe()
  }
  if (memberStore.isLoggedIn) {
    await loadMyData()
  } else {
    loaded.value = true
  }
})
</script>

<template>
  <main class="shell page-shell mx-auto w-[min(1480px,calc(100%_-_48px))] py-24">
    <section v-if="!memberStore.isLoggedIn" class="panel border border-neutral-200 bg-white p-6">
      <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
        MyData
      </p>
      <h1 class="page-title mt-3 max-w-4xl text-[clamp(34px,5vw,56px)] font-black leading-tight">
        로그인이 필요합니다
      </h1>
      <p class="muted mt-3 text-sm font-bold leading-7 text-neutral-500">
        마이데이터를 저장하면 지도 대출 계산과 LH 자격 확인을 바로 사용할 수 있습니다.
      </p>
      <RouterLink
        class="button primary mt-6 inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white"
        to="/login"
      >
        로그인
      </RouterLink>
    </section>

    <section v-else class="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside class="panel h-fit border border-neutral-200 bg-white p-6">
        <p class="eyebrow m-0 text-xs font-black uppercase tracking-[0.28em] text-[#b4212a]">
          MyData
        </p>
        <h1 class="mt-3 text-3xl font-black leading-tight text-[#171717]">마이데이터</h1>
        <p class="mt-3 text-sm font-bold leading-7 text-neutral-500">
          대출 계산과 LH 임대 자격 확인에 쓰는 기본 정보를 한 곳에서 관리합니다.
        </p>
        <div class="mt-6 border border-neutral-200 bg-[#f7f4ef] p-4">
          <span class="text-xs font-black text-neutral-500">입력 완료율</span>
          <strong class="mt-1 block text-3xl font-black text-[#b4212a]">{{ completion }}%</strong>
        </div>
        <div class="mt-5 grid gap-2">
          <button
            type="button"
            class="min-h-11 border px-4 font-black"
            :class="form.inputMode === 'wizard' ? 'border-[#b4212a] bg-[#b4212a] text-white' : 'border-neutral-200 bg-white text-[#171717]'"
            @click="startWizard"
          >
            간편 시작
          </button>
          <button
            type="button"
            class="min-h-11 border px-4 font-black"
            :class="form.inputMode === 'direct' ? 'border-[#171717] bg-[#171717] text-white' : 'border-neutral-200 bg-white text-[#171717]'"
            @click="form.inputMode = 'direct'"
          >
            직접 입력
          </button>
        </div>
        <RouterLink class="mt-6 inline-flex text-sm font-black text-[#b4212a]" to="/rentals">
          LH 공고 보러가기
        </RouterLink>
      </aside>

      <form class="panel border border-neutral-200 bg-white p-6" @submit.prevent="saveMyData">
        <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 class="text-2xl font-black text-[#171717]">LH 필수 정보</h2>
            <p class="mt-2 text-sm font-bold text-neutral-500">
              무주택, 소득, 자산, 희망 지역 정보는 LH 상세 화면에서 바로 비교됩니다.
            </p>
          </div>
          <button
            type="submit"
            class="button primary inline-flex min-h-11 items-center justify-center border border-[#b4212a] bg-[#b4212a] px-[18px] font-black text-white disabled:opacity-60"
            :disabled="saving"
          >
            {{ saving ? '저장 중' : '저장' }}
          </button>
        </div>

        <p v-if="message" class="mb-4 border border-emerald-200 bg-emerald-50 p-3 text-sm font-black text-emerald-700">
          {{ message }}
        </p>
        <p v-if="error" class="mb-4 border border-red-200 bg-red-50 p-3 text-sm font-black text-red-700">
          {{ error }}
        </p>
        <p v-if="!loaded" class="text-sm font-bold text-neutral-500">마이데이터를 불러오는 중입니다.</p>

        <div v-else class="grid gap-6">
          <section class="grid gap-4 md:grid-cols-3">
            <label class="grid gap-2">
              <span class="text-xs font-black text-neutral-500">생년월일</span>
              <input v-model="form.birthDate" type="date" class="min-h-11 border border-neutral-200 px-3 font-bold" />
              <span v-if="validationErrors.birthDate" class="text-xs font-bold text-red-600">{{ validationErrors.birthDate }}</span>
            </label>
            <label class="grid gap-2">
              <span class="text-xs font-black text-neutral-500">혼인 상태</span>
              <select v-model="form.maritalStatus" class="min-h-11 border border-neutral-200 px-3 font-bold">
                <option value="">선택</option>
                <option value="single">미혼</option>
                <option value="married">기혼</option>
                <option value="planned">예비 신혼부부</option>
              </select>
            </label>
            <label class="grid gap-2">
              <span class="text-xs font-black text-neutral-500">신혼부부 여부</span>
              <select v-model="form.isNewlywed" class="min-h-11 border border-neutral-200 px-3 font-bold">
                <option value="">선택</option>
                <option value="yes">예</option>
                <option value="no">아니오</option>
              </select>
            </label>
            <label class="grid gap-2">
              <span class="text-xs font-black text-neutral-500">혼인 기간(년)</span>
              <input v-model.number="form.marriageYears" type="number" min="0" class="min-h-11 border border-neutral-200 px-3 font-bold" />
            </label>
            <label class="grid gap-2">
              <span class="text-xs font-black text-neutral-500">자녀 수</span>
              <input v-model.number="form.childrenCount" type="number" min="0" class="min-h-11 border border-neutral-200 px-3 font-bold" />
            </label>
            <label class="grid gap-2">
              <span class="text-xs font-black text-neutral-500">가구원 수</span>
              <input v-model.number="form.householdMembers" type="number" min="1" class="min-h-11 border border-neutral-200 px-3 font-bold" />
              <span v-if="validationErrors.householdMembers" class="text-xs font-bold text-red-600">{{ validationErrors.householdMembers }}</span>
            </label>
            <label class="grid gap-2">
              <span class="text-xs font-black text-neutral-500">무주택 여부</span>
              <select v-model="form.isHomeless" class="min-h-11 border border-neutral-200 px-3 font-bold">
                <option value="">선택</option>
                <option value="yes">무주택</option>
                <option value="no">주택 보유</option>
              </select>
              <span v-if="validationErrors.isHomeless" class="text-xs font-bold text-red-600">{{ validationErrors.isHomeless }}</span>
            </label>
            <label class="grid gap-2">
              <span class="text-xs font-black text-neutral-500">세대주 여부</span>
              <select v-model="form.isHouseholdHead" class="min-h-11 border border-neutral-200 px-3 font-bold">
                <option value="">선택</option>
                <option value="yes">세대주</option>
                <option value="no">세대원</option>
                <option value="unknown">확인 필요</option>
              </select>
            </label>
            <label class="grid gap-2">
              <span class="text-xs font-black text-neutral-500">청약통장 가입 기간(개월)</span>
              <input v-model.number="form.subscriptionAccountMonths" type="number" min="0" class="min-h-11 border border-neutral-200 px-3 font-bold" />
            </label>
          </section>

          <section>
            <h3 class="text-xl font-black text-[#171717]">소득 · 자산 · 대출</h3>
            <div class="mt-4 grid gap-4 md:grid-cols-3">
              <label class="grid gap-2">
                <span class="text-xs font-black text-neutral-500">연소득(원)</span>
                <input v-model.number="form.annualIncome" type="number" min="0" class="min-h-11 border border-neutral-200 px-3 font-bold" />
                <span v-if="validationErrors.annualIncome" class="text-xs font-bold text-red-600">{{ validationErrors.annualIncome }}</span>
              </label>
              <label class="grid gap-2">
                <span class="text-xs font-black text-neutral-500">월 저축 가능액(원)</span>
                <input v-model.number="form.monthlySavings" type="number" min="0" class="min-h-11 border border-neutral-200 px-3 font-bold" />
              </label>
              <label class="grid gap-2">
                <span class="text-xs font-black text-neutral-500">사용 가능 자산(원)</span>
                <input v-model.number="form.availableAssets" type="number" min="0" class="min-h-11 border border-neutral-200 px-3 font-bold" />
              </label>
              <label class="grid gap-2">
                <span class="text-xs font-black text-neutral-500">총자산(원)</span>
                <input v-model.number="form.totalAssets" type="number" min="0" class="min-h-11 border border-neutral-200 px-3 font-bold" />
                <span v-if="validationErrors.totalAssets" class="text-xs font-bold text-red-600">{{ validationErrors.totalAssets }}</span>
              </label>
              <label class="grid gap-2">
                <span class="text-xs font-black text-neutral-500">자동차 가액(원)</span>
                <input v-model.number="form.carValue" type="number" min="0" class="min-h-11 border border-neutral-200 px-3 font-bold" />
              </label>
              <label class="grid gap-2">
                <span class="text-xs font-black text-neutral-500">기존 대출잔액(원)</span>
                <input v-model.number="form.existingLoanBalance" type="number" min="0" class="min-h-11 border border-neutral-200 px-3 font-bold" />
              </label>
              <label class="grid gap-2">
                <span class="text-xs font-black text-neutral-500">기존 월 상환액(원)</span>
                <input v-model.number="form.existingMonthlyDebtPayment" type="number" min="0" class="min-h-11 border border-neutral-200 px-3 font-bold" />
              </label>
            </div>
          </section>

          <section>
            <h3 class="text-xl font-black text-[#171717]">희망 조건</h3>
            <div class="mt-4 grid gap-4 md:grid-cols-[1fr_1fr]">
              <div class="grid gap-2">
                <span class="text-xs font-black text-neutral-500">희망 지역</span>
                <div class="flex gap-2">
                  <input v-model="regionInput" class="min-h-11 flex-1 border border-neutral-200 px-3 font-bold" placeholder="예: 서울, 경기" @keydown.enter.prevent="addRegion" />
                  <button type="button" class="min-h-11 border border-[#171717] px-4 font-black" @click="addRegion">추가</button>
                </div>
                <span v-if="validationErrors.desiredRegions" class="text-xs font-bold text-red-600">{{ validationErrors.desiredRegions }}</span>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="region in form.desiredRegions"
                    :key="region"
                    type="button"
                    class="border border-neutral-200 bg-[#f7f4ef] px-3 py-1 text-sm font-black"
                    @click="removeRegion(region)"
                  >
                    {{ region }} ×
                  </button>
                </div>
              </div>
              <div class="grid gap-2">
                <span class="text-xs font-black text-neutral-500">관심 임대 유형</span>
                <div class="flex flex-wrap gap-2">
                  <button
                    v-for="type in ['행복주택', '국민임대', '매입임대', '전세임대']"
                    :key="type"
                    type="button"
                    class="min-h-10 border px-4 text-sm font-black"
                    :class="form.rentalTypes.includes(type) ? 'border-[#b4212a] bg-[#b4212a] text-white' : 'border-neutral-200 bg-white text-[#171717]'"
                    @click="toggleRentalType(type)"
                  >
                    {{ type }}
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </form>
    </section>
  </main>
</template>
