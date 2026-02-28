export type Order = {
  id: string
  agency: string
  service: string
  date: string
  time: string
  hotel: string
  passengers: number
  room: string
  provider?: string
  flight: string
  notes?: string
  generatedAt: string
}

export type CompanyInfo = {
  razonSocial?: string
  direccion?: string
  sict?: string
  cobranza?: string
}
