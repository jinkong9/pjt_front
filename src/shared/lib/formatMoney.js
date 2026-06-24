export function formatManwonToKoreanMoney(value) {
  const normalizedValue = String(value ?? '').replace(/[^\d.-]/g, '')
  if (normalizedValue === '' || normalizedValue === '-' || normalizedValue === '.') {
    return '-'
  }

  const number = Number(normalizedValue)
  if (!Number.isFinite(number)) return value ?? '-'

  if (Math.abs(number) < 10000) {
    return `${number.toLocaleString('ko-KR')}만원`
  }

  const eok = number / 10000
  return `${eok.toLocaleString('ko-KR', {
    maximumFractionDigits: 2,
  })}억`
}
