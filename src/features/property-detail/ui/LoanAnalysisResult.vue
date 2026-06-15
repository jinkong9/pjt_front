<script setup>
defineProps({ analysis: { type: Object, required: true } })

function won(value) {
  return `${Math.round(Number(value || 0) / 10000).toLocaleString('ko-KR')}만원`
}

function duration(months) {
  if (months === null || months === undefined) return '예상기간 계산 불가'
  if (months === 0) return '현재 조건으로 가능'
  const years = Math.floor(months / 12)
  const rest = months % 12
  return `${years ? `${years}년 ` : ''}${rest ? `${rest}개월` : ''}`.trim()
}
</script>

<template>
  <div class="space-y-4">
    <section class="bg-[#171717] p-5 text-white">
      <p class="text-xs font-black uppercase tracking-[0.16em] text-white/60">내 집 마련 가능성</p>
      <h3 class="mt-3 text-xl font-black">
        <template v-if="analysis.readiness.feasibleNow">현재 조건으로 준비 가능해요</template>
        <template v-else>추가로 {{ won(analysis.readiness.additionalAssetsNeeded) }}이 필요해요</template>
      </h3>
      <p class="mt-2 text-xs text-white/60">목표 예상기간 · {{ duration(analysis.readiness.monthsToTarget) }}</p>
    </section>

    <div class="grid grid-cols-2 gap-2">
      <div v-for="item in [
        ['총 필요자금', analysis.cost.totalRequiredFunds],
        ['현재 보유자산', analysis.cost.availableAssets],
        ['예상 최대 대출액', analysis.limits.expectedMaximumLoan],
        ['최소 필요 자기자금', analysis.readiness.minimumRequiredEquity],
      ]" :key="item[0]" class="border border-neutral-200 bg-white p-3">
        <p class="text-[11px] font-black text-neutral-500">{{ item[0] }}</p>
        <strong class="mt-2 block text-sm text-neutral-900">{{ won(item[1]) }}</strong>
      </div>
    </div>

    <section class="border border-neutral-200 p-4 text-xs">
      <h4 class="font-black">상환 계획</h4>
      <div class="mt-3 flex justify-between"><span>예상 월 상환액</span><b>{{ won(analysis.repayment.monthlyPayment) }}</b></div>
      <div class="mt-2 flex justify-between"><span>상환 후 월 여유금액</span><b>{{ won(analysis.repayment.monthlyCashAfterPayment) }}</b></div>
    </section>

    <section class="border border-neutral-200 p-4">
      <h4 class="text-sm font-black">추천 상품</h4>
      <p v-if="analysis.recommendationWarning" class="mt-2 text-xs font-bold text-amber-700">{{ analysis.recommendationWarning }}</p>
      <p v-else-if="!analysis.recommendations.length" class="mt-2 text-xs text-neutral-500">추천 가능한 상품이 없습니다.</p>
      <article v-for="product in analysis.recommendations" :key="`${product.companyName}-${product.productName}`" class="mt-3 border-t border-neutral-200 pt-3 text-xs">
        <b>{{ product.companyName }} · {{ product.productName }}</b>
        <p class="mt-1 font-black text-[#b4212a]">연 {{ product.rate }}%</p>
      </article>
    </section>

    <p class="text-[11px] leading-5 text-neutral-500">{{ analysis.disclaimer }}</p>
  </div>
</template>
