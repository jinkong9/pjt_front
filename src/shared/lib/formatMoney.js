export function formatManwonToKoreanMoney(value) {
  const number = Number(String(value ?? '').replace(/[^\d.-]/g, ''))
  if (!Number.isFinite(number)) return value ?? '-'

  if (Math.abs(number) < 10000) {
    return `${number.toLocaleString('ko-KR')}만원`
  }

  const eok = number / 10000
  return `${eok.toLocaleString('ko-KR', {
    maximumFractionDigits: 2,
  })}억`
}
