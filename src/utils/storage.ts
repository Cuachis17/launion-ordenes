import Cookies from 'js-cookie'
import type { Order, CompanyInfo } from '../types'

const COOKIE_KEY = 'union_orders'
const COMPANY_KEY = 'union_company'

export function loadOrders(): Order[] {
  const raw = Cookies.get(COOKIE_KEY)
  if (!raw) return []
  try {
    return JSON.parse(raw) as Order[]
  } catch {
    return []
  }
}

export function saveOrders(orders: Order[]) {
  Cookies.set(COOKIE_KEY, JSON.stringify(orders), { expires: 30 })
}

export function loadCompany(): CompanyInfo {
  const raw = Cookies.get(COMPANY_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as CompanyInfo
  } catch {
    return {}
  }
}

export function saveCompany(info: CompanyInfo) {
  Cookies.set(COMPANY_KEY, JSON.stringify(info), { expires: 365 })
}
