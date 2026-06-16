import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import LoanAnalysisResult from './LoanAnalysisResult.vue'

function analysis(overrides = {}) {
  return {
    cost: {
      propertyPrice: 320000000,
      incidentalCost: 12800000,
      totalRequiredFunds: 332800000,
      availableAssets: 50000000,
      existingLoanBalance: 0,
    },
    limits: {
      fundingNeed: 282800000,
      ltvLimit: 192000000,
      dsrLoanLimit: 0,
      expectedMaximumLoan: 0,
    },
    readiness: {
      minimumRequiredEquity: 332800000,
      additionalAssetsNeeded: 282800000,
      monthsToTarget: 236,
      feasibleNow: false,
    },
    repayment: {
      monthlyPayment: 0,
      totalInterest: 0,
      totalPayment: 0,
      monthlyCashAfterPayment: -1200000,
    },
    recommendations: [],
    recommendationWarning: null,
    disclaimer: '참고용 시뮬레이션입니다.',
    ...overrides,
  }
}

describe('LoanAnalysisResult', () => {
  it('shows additional assets as a primary funding metric', () => {
    const wrapper = mount(LoanAnalysisResult, { props: { analysis: analysis() } })

    expect(wrapper.text()).toContain('추가 필요자금')
    expect(wrapper.text()).toContain('28,280만원')
    expect(wrapper.find('[data-testid="readiness-card"]').classes()).toContain('rounded-[18px]')
  })

  it('labels negative monthly cash flow as a repayment burden', () => {
    const wrapper = mount(LoanAnalysisResult, { props: { analysis: analysis() } })

    expect(wrapper.text()).toContain('월 상환 부담 초과')
    expect(wrapper.get('[data-testid="monthly-cash-flow"]').classes()).toContain('text-red-700')
  })
})
