import { formatManwonToKoreanMoney } from '@/shared/lib/formatMoney'

function normalizeText(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, '')
}

function numberValue(value) {
  const numeric = Number(String(value ?? '').replace(/[^0-9.-]/g, ''))
  return Number.isFinite(numeric) ? numeric : 0
}

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== '')
}

export function getPropertyTypeLabel(trade = {}) {
  const rawType = firstPresent(
    trade.propertyType,
    trade.property_type,
    trade.houseType,
    trade.house_type,
    trade.buildingType,
    trade.building_type,
    trade.estateType,
    trade.estate_type,
    trade.realEstateType,
    trade.real_estate_type,
  )
  const normalizedType = normalizeText(rawType)
  const normalizedName = normalizeText(firstPresent(trade.aptName, trade.apt_nm, trade.apt_name))

  if (['officetel', 'officehotel', '오피스텔'].includes(normalizedType)) return '오피스텔'
  if (['oneroom', 'one룸', '원룸', '다세대', '다가구'].includes(normalizedType)) return '원룸'
  if (['apt', 'apartment', '아파트'].includes(normalizedType)) return '아파트'

  if (normalizedName.includes('오피스텔')) return '오피스텔'
  if (normalizedName.includes('원룸')) return '원룸'

  return '아파트'
}

export function getDealTypeLabel(trade = {}) {
  const rawType = firstPresent(
    trade.dealType,
    trade.deal_type,
    trade.tradeType,
    trade.trade_type,
    trade.rentType,
    trade.rent_type,
    trade.transactionType,
    trade.transaction_type,
  )
  const normalizedType = normalizeText(rawType)

  if (['sale', 'sell', '매매'].includes(normalizedType)) return '매매'
  if (['jeonse', 'charter', '전세'].includes(normalizedType)) return '전세'
  if (['monthlyrent', 'monthly', 'wolse', '월세'].includes(normalizedType)) return '월세'
  if (normalizedType === 'rent') {
    return numberValue(
      firstPresent(trade.monthlyRentAmount, trade.monthly_rent_amount, trade.monthlyRent),
    ) > 0
      ? '월세'
      : '전세'
  }

  const monthlyRentAmount = numberValue(
    firstPresent(trade.monthlyRentAmount, trade.monthly_rent_amount, trade.monthlyRent),
  )
  const depositAmount = numberValue(
    firstPresent(trade.depositAmount, trade.deposit_amount, trade.deposit),
  )

  if (monthlyRentAmount > 0) return '월세'
  if (depositAmount > 0) return '전세'
  return '매매'
}

export function getHouseTradeLabel(trade = {}) {
  return `${getPropertyTypeLabel(trade)} / ${getDealTypeLabel(trade)}`
}

export function getHouseTradePriceLabel(trade = {}) {
  const dealType = getDealTypeLabel(trade)
  const dealAmount = firstPresent(trade.dealAmount, trade.deal_amount)
  const depositAmount = firstPresent(trade.depositAmount, trade.deposit_amount, trade.deposit)
  const monthlyRentAmount = firstPresent(
    trade.monthlyRentAmount,
    trade.monthly_rent_amount,
    trade.monthlyRent,
  )

  if (dealType === '월세') {
    const deposit = formatManwonToKoreanMoney(depositAmount)
    const monthlyRent = formatManwonToKoreanMoney(monthlyRentAmount)
    return `${deposit} / ${monthlyRent}`
  }

  if (dealType === '전세') {
    return formatManwonToKoreanMoney(depositAmount || dealAmount)
  }

  return formatManwonToKoreanMoney(dealAmount || depositAmount)
}
