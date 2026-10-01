// Editor de datos de empresa que se imprimen en los PDF.
import { useState } from 'react'
import type { CompanyInfo } from '../types'
export default function CompanyEditor({ companyInfo, abierto, isRoot, onCerrar, onGuardar }: {
 companyInfo: CompanyInfo
 abierto: boolean
 isRoot: boolean
 onCerrar: () => void
 onGuardar: (info: CompanyInfo) => void
}) {
  const [tempRazonSocial, setTempRazonSocial] = useState(companyInfo.razonSocial || '')
  const [tempDireccion, setTempDireccion] = useState(companyInfo.direccion || '')
  const [tempSict, setTempSict] = useState(companyInfo.sict || '')
  const [tempCobranza, setTempCobranza] = useState(companyInfo.cobranza || '')
  function handleCancelEdit() {
    onCerrar()
  }

  function handleSaveCompanyInfo() {
    onGuardar({
      razonSocial: tempRazonSocial.trim() || undefined,
      direccion: tempDireccion.trim() || undefined,
      sict: tempSict.trim() || undefined,
      cobranza: tempCobranza.trim() || undefined,
    })
    onCerrar()
  }

return <>
      {/* Modal de Edición de Información de Empresa */}
      {abierto && (
        <div
        className="fixed inset-0 bg-foreground/50 flex items-center
justify-center z-50 p-4">
          <div
        className="bg-card rounded-xl shadow-2xl max-w-md w-full max-h-[90vh]
overflow-y-auto">
            <div
        className="flex items-center justify-between p-6 border-b border-border">
              <h2
        className="text-xl font-semibold text-foreground">Configuración del PDF</h2>
              <button
                onClick={handleCancelEdit}
                className="p-1 hover:bg-muted rounded-lg transition-colors"
              >
                <svg
        className="w-5 h-5 text-muted-foreground"
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg">
                  <path d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div
        className="p-6">
              <div
        className="mb-4">
                <label htmlFor="razonSocial"
        className="block text-sm font-medium text-foreground mb-2">
                  Razón Social / Dirección
                </label>
                <input
                  id="razonSocial"
                  type="text"
                  value={tempRazonSocial}
                  onChange={(e) => setTempRazonSocial(e.target.value)}
                  placeholder="Ej: Servans Travel S.A. de C.V."
                  className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2
focus:ring-ring focus:border-transparent"
                />
                <p
        className="text-xs text-muted-foreground mt-2 mb-4">
                  Si se deja vacío, no aparecerá en el encabezado del PDF
                </p>

                <label htmlFor="direccion"
        className={`block text-sm font-medium mb-2 ${isRoot
          ? 'text-foreground'
          : 'text-muted-foreground'}`}>
                  Dirección
                </label>
                <input
                  id="direccion"
                  type="text"
                  value={tempDireccion}
                  onChange={(e) => setTempDireccion(e.target.value)}
                  disabled={!isRoot}
                  placeholder="Ej: Calle Principal 123"
                  className={`w-full px-4 py-2 border rounded-lg
                    focus:ring-2
                    focus:ring-ring focus:border-transparent mb-4 ${!isRoot
                    ? 'bg-muted border-border cursor-not-allowed ' +
                      'text-muted-foreground'
                    : 'border-border'}`}
                />

                <label htmlFor="sict"
        className={`block text-sm font-medium mb-2 ${isRoot
          ? 'text-foreground'
          : 'text-muted-foreground'}`}>
                  Permiso SICT
                </label>
                <input
                  id="sict"
                  type="text"
                  value={tempSict}
                  onChange={(e) => setTempSict(e.target.value)}
                  disabled={!isRoot}
                  placeholder="Ej: 123456789"
                  className={`w-full px-4 py-2 border rounded-lg
                    focus:ring-2
                    focus:ring-ring focus:border-transparent mb-4 ${!isRoot
                    ? 'bg-muted border-border cursor-not-allowed ' +
                      'text-muted-foreground'
                    : 'border-border'}`}
                />

                <label htmlFor="cobranza"
        className={`block text-sm font-medium mb-2 ${isRoot
          ? 'text-foreground'
          : 'text-muted-foreground'}`}>
                  Teléfono de Cobranza
                </label>
                <input
                  id="cobranza"
                  type="text"
                  value={tempCobranza}
                  onChange={(e) => setTempCobranza(e.target.value)}
                  disabled={!isRoot}
                  placeholder="Ej: 555 123 4567"
                  className={`w-full px-4 py-2 border rounded-lg
                    focus:ring-2
                    focus:ring-ring focus:border-transparent ${!isRoot
                    ? 'bg-muted border-border cursor-not-allowed ' +
                      'text-muted-foreground'
                    : 'border-border'}`}
                />
              </div>
            </div>

            <div
        className="flex gap-3 p-6 border-t border-border">
              <button
                onClick={handleCancelEdit}
                className="flex-1 px-4 py-2 border border-border rounded-lg text-foreground
hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveCompanyInfo}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg
hover:bg-primary/90 transition-colors"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}


</>
}
