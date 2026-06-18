export const MYDATA_STORAGE_KEY = 'happyhome.mydata.profile'

export const defaultMyDataProfile = {
  inputMode: 'direct',
  birthDate: '',
  maritalStatus: '',
  isNewlywed: '',
  marriageYears: '',
  childrenCount: 0,
  householdMembers: '',
  isHomeless: '',
  isHouseholdHead: '',
  subscriptionAccountMonths: '',
  annualIncome: '',
  monthlySavings: '',
  availableAssets: '',
  totalAssets: '',
  carValue: '',
  desiredRegions: [],
  rentalTypes: [],
  existingLoanBalance: 0,
  existingMonthlyDebtPayment: 0,
}

function numberOrZero(value) {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : 0
}

function hasValue(value) {
  return value !== undefined && value !== null && value !== ''
}

export function normalizeMyDataProfile(profile = {}) {
  return {
    ...defaultMyDataProfile,
    ...profile,
    desiredRegions: Array.isArray(profile.desiredRegions) ? profile.desiredRegions : [],
    rentalTypes: Array.isArray(profile.rentalTypes) ? profile.rentalTypes : [],
  }
}

export function validateMyDataProfile(profile) {
  const errors = {}

  if (!profile.birthDate) errors.birthDate = '생년월일을 입력해 주세요.'
  if (!hasValue(profile.householdMembers)) errors.householdMembers = '가구원 수를 입력해 주세요.'
  if (!profile.isHomeless) errors.isHomeless = '무주택 여부를 선택해 주세요.'
  if (!hasValue(profile.annualIncome)) errors.annualIncome = '연소득을 입력해 주세요.'
  if (!hasValue(profile.totalAssets)) errors.totalAssets = '총자산을 입력해 주세요.'
  if (!profile.desiredRegions?.length) errors.desiredRegions = '희망 지역을 1개 이상 입력해 주세요.'

  return errors
}

export function buildFinancialPayload(profile) {
  return {
    annualIncome: numberOrZero(profile.annualIncome),
    availableAssets: numberOrZero(profile.availableAssets),
    monthlySavings: numberOrZero(profile.monthlySavings),
    existingLoanBalance: numberOrZero(profile.existingLoanBalance),
    existingMonthlyDebtPayment: numberOrZero(profile.existingMonthlyDebtPayment),
  }
}

export function readStoredMyDataProfile() {
  try {
    return normalizeMyDataProfile(JSON.parse(localStorage.getItem(MYDATA_STORAGE_KEY) || '{}'))
  } catch {
    return normalizeMyDataProfile()
  }
}

export function saveStoredMyDataProfile(profile) {
  const normalizedProfile = normalizeMyDataProfile(profile)
  localStorage.setItem(MYDATA_STORAGE_KEY, JSON.stringify(normalizedProfile))
  return normalizedProfile
}

export function evaluateRentalEligibility(profile, rentalDetail) {
  const normalizedProfile = normalizeMyDataProfile(profile)
  const notice = rentalDetail?.notice ?? {}
  const checks = [
    {
      key: 'homeless',
      passed: normalizedProfile.isHomeless === 'yes',
      message: normalizedProfile.isHomeless === 'yes' ? '무주택 조건 입력 완료' : '무주택 여부 확인 필요',
    },
    {
      key: 'region',
      passed: normalizedProfile.desiredRegions.some((region) => notice.regionName?.includes(region)),
      message: '희망 지역과 공고 지역 비교',
    },
    {
      key: 'income',
      passed: numberOrZero(normalizedProfile.annualIncome) > 0,
      message: '소득 정보 입력 완료',
    },
    {
      key: 'assets',
      passed: numberOrZero(normalizedProfile.totalAssets) > 0,
      message: '자산 정보 입력 완료',
    },
  ]
  const passedCount = checks.filter((check) => check.passed).length

  return {
    status: passedCount >= 4 ? '가능성 높음' : passedCount >= 2 ? '추가 확인' : '입력 필요',
    checks,
  }
}
