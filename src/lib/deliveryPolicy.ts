export type DeliveryPlan = 'presenca' | 'landingpage' | 'destaque' | 'premium'

export type DeliveryCityRule = {
  id?: string
  city: string
  state: string
  zipcode?: string | null
  delivery_fee: number
  eta_business_days?: number | null
  active?: boolean
  is_base_city?: boolean
}

export function normalizeStorePlanForDelivery(plan?: string | null): DeliveryPlan {
  const normalized = String(plan || '').toLowerCase()
  if (normalized === 'destaque') return 'destaque'
  if (normalized === 'premium') return 'premium'
  if (normalized === 'landingpage') return 'landingpage'
  return 'presenca'
}

export function getExtraDeliveryCitiesLimit(plan?: string | null) {
  const normalized = normalizeStorePlanForDelivery(plan)
  if (normalized === 'destaque') return 2
  if (normalized === 'premium') return 4
  return 0
}

export function getTotalDeliveryCitiesLimit(plan?: string | null) {
  return 1 + getExtraDeliveryCitiesLimit(plan)
}

export function normalizeText(value?: string | null) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

export function normalizeZipcode(value?: string | null) {
  const digits = String(value || '').replace(/\D/g, '')
  if (!digits) return ''
  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`
}

export function toZipDigits(value?: string | null) {
  return String(value || '').replace(/\D/g, '')
}

export function normalizeState(value?: string | null) {
  return String(value || '').toUpperCase().trim().slice(0, 2)
}

export function normalizeCity(value?: string | null) {
  return String(value || '').trim()
}

export function dedupeDeliveryCities(cities: DeliveryCityRule[]) {
  const seen = new Set<string>()
  const unique: DeliveryCityRule[] = []

  cities.forEach((item) => {
    const city = normalizeCity(item.city)
    const state = normalizeState(item.state)
    const zipDigits = toZipDigits(item.zipcode)
    const key = `${normalizeText(city)}|${normalizeText(state)}|${zipDigits}`

    if (!city || !state) return
    if (seen.has(key)) return

    seen.add(key)
    unique.push({
      ...item,
      city,
      state,
      zipcode: normalizeZipcode(item.zipcode),
      delivery_fee: Number.isFinite(Number(item.delivery_fee)) ? Number(item.delivery_fee) : 0,
      eta_business_days: Number.isFinite(Number(item.eta_business_days)) ? Number(item.eta_business_days) : 1,
      active: item.active !== false,
    })
  })

  return unique
}

export function matchDeliveryCityRule(
  rules: DeliveryCityRule[],
  clientLocation: { city?: string | null; state?: string | null; zipcode?: string | null },
) {
  const activeRules = rules.filter((rule) => rule.active !== false)
  const clientZip = toZipDigits(clientLocation.zipcode)

  if (clientZip) {
    const byZip = activeRules.find((rule) => toZipDigits(rule.zipcode) === clientZip)
    if (byZip) return byZip
  }

  const clientCity = normalizeText(clientLocation.city)
  const clientState = normalizeText(clientLocation.state)

  if (!clientCity || !clientState) return null

  return activeRules.find((rule) => {
    return normalizeText(rule.city) === clientCity && normalizeText(rule.state) === clientState
  }) || null
}
