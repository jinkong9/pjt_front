<script setup>
import { reactive } from 'vue'

const props = defineProps({
  initialValue: { type: Object, default: null },
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

function submit() {
  emit(
    'save',
    Object.fromEntries(Object.entries(form).map(([key, value]) => [key, Number(value || 0)])),
  )
}
</script>

<template>
  <form class="space-y-4" @submit.prevent="submit">
    <div>
      <p class="text-xs font-black uppercase tracking-[0.18em] text-[#b4212a]">Financial Profile</p>
      <h3 class="mt-2 text-xl font-black">내 금융정보 입력</h3>
      <p class="mt-2 text-xs leading-5 text-neutral-500">입력값은 대출 가능성 시뮬레이션에만 사용됩니다.</p>
    </div>
    <label v-for="field in [
      ['availableAssets', '보유자산'],
      ['annualIncome', '연소득'],
      ['monthlySavings', '월 가용저축액'],
      ['existingLoanBalance', '기존 대출잔액'],
      ['existingMonthlyDebtPayment', '기존 월 상환액'],
    ]" :key="field[0]" class="block text-xs font-black text-neutral-600">
      {{ field[1] }} (원)
      <input v-model="form[field[0]]" type="number" min="0" class="mt-2 h-11 w-full border-neutral-300 text-sm font-bold" />
    </label>
    <button class="h-12 w-full bg-[#b4212a] text-sm font-black text-white" :disabled="saving">
      {{ saving ? '저장 중...' : '저장하고 분석하기' }}
    </button>
  </form>
</template>
