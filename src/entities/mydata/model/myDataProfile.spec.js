import { describe, expect, it } from 'vitest'

import { buildFinancialPayload, evaluateRentalEligibility, validateMyDataProfile } from './myDataProfile'

describe('myDataProfile', () => {
  it('validates required LH MyData fields', () => {
    const errors = validateMyDataProfile({
      birthDate: '',
      householdMembers: '',
      isHomeless: '',
      annualIncome: '',
      totalAssets: '',
      desiredRegions: [],
    })

    expect(errors).toMatchObject({
      birthDate: '생년월일을 입력해 주세요.',
      householdMembers: '가구원 수를 입력해 주세요.',
      isHomeless: '무주택 여부를 선택해 주세요.',
      annualIncome: '연소득을 입력해 주세요.',
      totalAssets: '총자산을 입력해 주세요.',
      desiredRegions: '희망 지역을 1개 이상 입력해 주세요.',
    })
  })

  it('extracts the backend financial profile payload from extended MyData', () => {
    expect(
      buildFinancialPayload({
        annualIncome: 52000000,
        availableAssets: 80000000,
        monthlySavings: 1200000,
        existingLoanBalance: 30000000,
        existingMonthlyDebtPayment: 450000,
        totalAssets: 90000000,
      }),
    ).toEqual({
      annualIncome: 52000000,
      availableAssets: 80000000,
      monthlySavings: 1200000,
      existingLoanBalance: 30000000,
      existingMonthlyDebtPayment: 450000,
    })
  })

  it('evaluates basic LH eligibility from MyData and rental detail', () => {
    expect(
      evaluateRentalEligibility(
        {
          birthDate: '1997-01-01',
          isHomeless: 'yes',
          annualIncome: 42000000,
          totalAssets: 120000000,
          desiredRegions: ['서울'],
        },
        {
          notice: {
            title: '서울 행복주택 입주자 모집',
            regionName: '서울특별시',
            detailType: '행복주택',
          },
        },
      ).status,
    ).toBe('가능성 높음')
  })
})
