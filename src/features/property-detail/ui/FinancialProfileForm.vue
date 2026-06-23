<script setup>
import { computed, reactive, ref } from 'vue'
import { normalizeMyDataProfile } from '@/entities/mydata/model/myDataProfile'

const props = defineProps({
  initialValue: { type: Object, default: null },
  initialMyData: { type: Object, default: null },
  saving: Boolean,
})
const emit = defineEmits(['save'])

const form = reactive({
  availableAssets: props.initialValue?.availableAssets ?? 0,
  annualIncome: props.initialValue?.annualIncome ?? 0,
  monthlySavings: props.initialValue?.monthlySavings ?? 0,
  existingLoanBalance: props.initialValue?.existingLoanBalance ?? 0,
  existingMonthlyDebtPayment: props.initialValue?.existingMonthlyDebtPayment ?? 0,
})
const myData = reactive(normalizeMyDataProfile(props.initialMyData ?? props.initialValue ?? {}))
const regionInput = ref('')
const financialFields = [
  ['availableAssets', '보유자산'],
  ['annualIncome', '연소득'],
  ['monthlySavings', '월 가용저축액'],
  ['existingLoanBalance', '기존 대출잔액'],
  ['existingMonthlyDebtPayment', '기존 월 상환액'],
]
const householdFields = [
  ['birthDate', '생년월일', 'date'],
  ['householdMembers', '가구원 수', 'number'],
  ['childrenCount', '자녀 수', 'number'],
  ['subscriptionAccountMonths', '청약통장 가입 개월', 'number'],
]
const rentalTypes = ['행복주택', '국민임대', '매입임대', '전세임대']
const completion = computed(() => {
  const required = [
    form.availableAssets,
    form.annualIncome,
    myData.householdMembers,
    myData.isHomeless,
    myData.desiredRegions.length,
  ]
  return Math.round((required.filter(Boolean).length / required.length) * 100)
})

function submit() {
  emit('save', {
    financialProfile: Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, Number(value || 0)]),
    ),
    myDataProfile: normalizeMyDataProfile({
      ...myData,
      annualIncome: form.annualIncome,
      availableAssets: form.availableAssets,
      monthlySavings: form.monthlySavings,
      existingLoanBalance: form.existingLoanBalance,
      existingMonthlyDebtPayment: form.existingMonthlyDebtPayment,
    }),
  })
}

function formatNumber(value) {
  const number = Number(String(value ?? '').replace(/[^\d]/g, ''))
  if (!Number.isFinite(number)) return ''
  return number.toLocaleString('ko-KR')
}

function updateMoneyField(key, value) {
  form[key] = String(value ?? '').replace(/[^\d]/g, '')
}

function addRegion() {
  const nextRegion = regionInput.value.trim()
  if (!nextRegion || myData.desiredRegions.includes(nextRegion)) return
  myData.desiredRegions.push(nextRegion)
  regionInput.value = ''
}

function removeRegion(region) {
  myData.desiredRegions = myData.desiredRegions.filter((item) => item !== region)
}

function toggleRentalType(type) {
  myData.rentalTypes = myData.rentalTypes.includes(type)
    ? myData.rentalTypes.filter((item) => item !== type)
    : [...myData.rentalTypes, type]
}
</script>

<template>
  <form data-testid="financial-profile-form" class="grid gap-5 lg:grid-cols-[260px_1fr]" @submit.prevent="submit">
    <aside class="border border-neutral-200 bg-[#faf8f5] p-5">
      <p class="text-xs font-black uppercase tracking-[0.22em] text-[#b4212a]">MyData</p>
      <h3 class="mt-2 text-2xl font-black leading-tight text-[#171717]">LH 추천 준비</h3>
      <p class="mt-3 text-sm font-bold leading-6 text-neutral-500">
        대출 계산 정보와 LH 추천 조건을 함께 저장합니다.
      </p>
      <div class="mt-5 border border-neutral-200 bg-white p-4">
        <span class="text-xs font-black text-neutral-500">입력 완성도</span>
        <strong class="mt-1 block text-3xl font-black text-[#b4212a]">{{ completion }}%</strong>
      </div>
      <div class="mt-4 flex flex-wrap gap-2">
        <span class="border border-neutral-200 bg-white px-3 py-1 text-xs font-black">금융 5개 필드</span>
        <span class="border border-neutral-200 bg-white px-3 py-1 text-xs font-black">무주택/세대</span>
        <span class="border border-neutral-200 bg-white px-3 py-1 text-xs font-black">희망 지역</span>
      </div>
    </aside>

    <div class="grid gap-5">
      <section class="border border-neutral-200 bg-white p-5">
        <div>
          <p class="text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]">Financial Profile</p>
          <h3 class="mt-1 text-2xl font-black">대출 계산용 정보</h3>
          <p class="mt-2 text-sm font-bold leading-6 text-neutral-500">
            이 5개 항목은 백엔드 금융 프로필에 저장되어 대출 계산과 LH 추천 점수에 사용됩니다.
          </p>
        </div>
        <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <label v-for="field in financialFields" :key="field[0]" class="block text-xs font-black text-neutral-600">
            {{ field[1] }} (원)
            <input
              :value="formatNumber(form[field[0]])"
              type="text"
              inputmode="numeric"
              :data-testid="`financial-field-${field[0]}`"
              class="mt-2 h-11 w-full border border-neutral-300 px-3 text-sm font-bold"
              @input="updateMoneyField(field[0], $event.target.value)"
            />
          </label>
        </div>
      </section>

      <section class="border border-neutral-200 bg-[#faf8f5] p-5">
        <h3 class="text-2xl font-black text-[#171717]">LH 추천 조건</h3>
        <p class="mt-2 text-sm font-bold leading-6 text-neutral-500">
          무주택, 가구, 희망지역, 임대 유형을 넣어두면 LH 공고를 볼 때 추천/자격 판단에 같이 활용할 수 있습니다.
        </p>
        <div class="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <label v-for="field in householdFields" :key="field[0]" class="block text-xs font-black text-neutral-600">
            {{ field[1] }}
            <input
              v-model="myData[field[0]]"
              :type="field[2]"
              min="0"
              :data-testid="`mydata-field-${field[0]}`"
              class="mt-2 h-11 w-full border border-neutral-300 bg-white px-3 text-sm font-bold"
            />
          </label>
          <label class="block text-xs font-black text-neutral-600">
            무주택 여부
            <select
              v-model="myData.isHomeless"
              data-testid="mydata-field-isHomeless"
              class="mt-2 h-11 w-full border border-neutral-300 bg-white px-3 text-sm font-bold"
            >
              <option value="">선택</option>
              <option value="yes">무주택</option>
              <option value="no">주택 보유</option>
            </select>
          </label>
          <label class="block text-xs font-black text-neutral-600">
            세대주 여부
            <select
              v-model="myData.isHouseholdHead"
              data-testid="mydata-field-isHouseholdHead"
              class="mt-2 h-11 w-full border border-neutral-300 bg-white px-3 text-sm font-bold"
            >
              <option value="">선택</option>
              <option value="yes">세대주</option>
              <option value="no">세대원</option>
              <option value="unknown">확인 필요</option>
            </select>
          </label>
          <label class="block text-xs font-black text-neutral-600">
            총자산 (원)
            <input
              v-model="myData.totalAssets"
              type="number"
              min="0"
              data-testid="mydata-field-totalAssets"
              class="mt-2 h-11 w-full border border-neutral-300 bg-white px-3 text-sm font-bold"
            />
          </label>
          <label class="block text-xs font-black text-neutral-600">
            자동차 가액 (원)
            <input
              v-model="myData.carValue"
              type="number"
              min="0"
              data-testid="mydata-field-carValue"
              class="mt-2 h-11 w-full border border-neutral-300 bg-white px-3 text-sm font-bold"
            />
          </label>
        </div>

        <div class="mt-5 grid gap-4 lg:grid-cols-2">
          <div class="grid gap-2">
            <span class="text-xs font-black text-neutral-600">희망 지역</span>
            <div class="flex gap-2">
              <input
                v-model="regionInput"
                data-testid="mydata-field-desiredRegion"
                class="h-11 min-w-0 flex-1 border border-neutral-300 bg-white px-3 text-sm font-bold"
                placeholder="예: 서울, 경기"
                @keydown.enter.prevent="addRegion"
              />
              <button
                type="button"
                data-testid="mydata-add-region"
                class="h-11 border border-[#171717] bg-white px-4 text-sm font-black text-[#171717]"
                @click="addRegion"
              >
                추가
              </button>
            </div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="region in myData.desiredRegions"
                :key="region"
                type="button"
                class="border border-neutral-200 bg-white px-3 py-1 text-sm font-black"
                @click="removeRegion(region)"
              >
                {{ region }} x
              </button>
            </div>
          </div>
          <div class="grid gap-2">
            <span class="text-xs font-black text-neutral-600">관심 임대 유형</span>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="type in rentalTypes"
                :key="type"
                type="button"
                :data-testid="`mydata-rental-type-${type}`"
                class="h-10 border px-4 text-sm font-black"
                :class="myData.rentalTypes.includes(type) ? 'border-[#b4212a] bg-[#b4212a] text-white' : 'border-neutral-300 bg-white text-[#171717]'"
                @click="toggleRentalType(type)"
              >
                {{ type }}
              </button>
            </div>
          </div>
        </div>
      </section>

      <button
        class="min-h-12 w-full border border-[#b4212a] bg-[#b4212a] text-sm font-black text-white hover:bg-[#941b23] disabled:cursor-wait disabled:opacity-65"
        :disabled="saving"
      >
        {{ saving ? '저장 중...' : '저장하고 LH 추천 준비하기' }}
      </button>
    </div>
  </form>
</template>
