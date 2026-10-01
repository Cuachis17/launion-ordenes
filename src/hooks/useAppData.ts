// Datos locales y edición de órdenes y comprobantes.
import { useEffect, useState } from 'react'
import { loadOrders, saveOrders, loadCompany, saveCompany } from '../utils/storage'
import { loadReceipts, saveReceipts } from '../utils/receiptStorage'
import { useAvisoCreado } from './useAvisoCreado'
import { siguienteVoucher, type Receipt, type Order, type CompanyInfo } from '../types'
export function useAppData() {
  const avisoCreado = useAvisoCreado()
  const [reservations, setReservations] = useState<Order[]>(() => loadOrders())
  const [receipts, setReceipts] = useState<Receipt[]>(() => loadReceipts())
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null)
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => loadCompany())
  const [editingReservation, setEditingReservation] = useState<Order | null>(null)

  useEffect(() => {
    saveOrders(reservations)
  }, [reservations])

  useEffect(() => {
    saveCompany(companyInfo)
  }, [companyInfo])

  function handleAddReservation(o: Order) {
    setReservations((prev) => [o, ...prev].slice(0, 10))
    avisoCreado.mostrar('orden', o.id)
  }

  function handleDeleteReservation(id: string) {
    setReservations((prev) => prev.filter((r) => r.id !== id))
  }

  function handleEditClick(o: Order) {
    setEditingReservation(o)
  }

  function handleSaveEditedReservation(o: Order) {
    setReservations(prev => prev.map(r => r.id === o.id ? o : r))
    setEditingReservation(null)
  }

  function handleAddReceipt(entrante: Receipt) {
    // El voucher es opcional al capturar: si viene vacío se asigna el siguiente
    // de la serie, para que ningún comprobante quede sin folio.
    const r: Receipt = entrante.voucher.trim()
      ? { ...entrante, voucher: entrante.voucher.trim() }
      : { ...entrante, voucher: siguienteVoucher(receipts) }
    const siguientes = [r, ...receipts]
    if (!saveReceipts(siguientes)) {
      alert('No se pudo guardar el comprobante: ' +
        'el almacenamiento del navegador está lleno o bloqueado.')
      return false
    }
    // El aviso confirma persistencia; nunca anuncia éxito cuando falló localStorage.
    setReceipts(siguientes)
    avisoCreado.mostrar('comprobante', r.id)
    return true
  }

  // Duplicar es lo más pedido en operación: el mismo traslado con otro pasajero.
  function handleDuplicateReceipt(r: Receipt) {
    setEditingReceipt({
      ...r,
      id: crypto.randomUUID(),
      voucher: '',
      passenger: '',
      generatedAt: new Date().toISOString(),
    })
  }

  function handleSaveEditedReceipt(r: Receipt) {
    const existe = receipts.some((x) => x.id === r.id)
    const siguientes = existe ? receipts.map((x) => (x.id === r.id ? r : x)) : [r, ...receipts]
    setReceipts(siguientes)
    saveReceipts(siguientes)
    setEditingReceipt(null)
  }

  function handleDeleteReceipt(id: string) {
    const siguientes = receipts.filter((x) => x.id !== id)
    setReceipts(siguientes)
    saveReceipts(siguientes)
  }

return {
  avisoCreado, reservations, receipts, editingReceipt, setEditingReceipt, companyInfo,
  setCompanyInfo, editingReservation, setEditingReservation, handleAddReservation,
  handleDeleteReservation, handleEditClick, handleSaveEditedReservation,
  handleAddReceipt, handleDuplicateReceipt, handleSaveEditedReceipt,
  handleDeleteReceipt
}
}
