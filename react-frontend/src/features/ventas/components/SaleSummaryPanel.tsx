"use client"

import { Loader2 } from "lucide-react"
import { formatMoney } from "../../../utils/number"

type Props = {
  subtotal: number
  descuento: number
  iva: number
  total: number
  hasItems: boolean
  isSubmitting: boolean
  onCancel: () => void
  onDescuentoChange: (value: string) => void
}

export function SaleSummaryPanel({ subtotal, descuento, iva, total, hasItems, isSubmitting, onCancel, onDescuentoChange }: Props) {
  return (
    <div className="flex h-full flex-col border-l border-slate-200 bg-slate-50">
      {/* Resumen - crece para llenar espacio */}
      <div className="flex-1 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Resumen</h3>

        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="tabular-nums font-medium">{formatMoney(subtotal)}</span>
          </div>
          
          <div className="space-y-1">
            <label className="text-xs font-medium uppercase text-slate-500">Descuento general</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={descuento || ''}
              onChange={(e) => onDescuentoChange(e.target.value)}
              placeholder="0.00"
              className="h-9 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          
          {descuento > 0 && (
            <div className="flex justify-between text-emerald-600">
              <span>Descuento aplicado</span>
              <span className="tabular-nums font-medium">-{formatMoney(descuento)}</span>
            </div>
          )}
          
          <div className="flex justify-between text-slate-600">
            <span>IVA (15%)</span>
            <span className="tabular-nums font-medium">{formatMoney(iva)}</span>
          </div>
          <div className="border-t border-slate-200 my-2"></div>
          <div className="flex justify-between items-baseline text-slate-900">
            <span className="text-base font-bold">Total</span>
            <span className="text-2xl font-bold tabular-nums">{formatMoney(total)}</span>
          </div>
        </div>
      </div>

      {/* Acciones sticky al fondo */}
      <div className="sticky bottom-0 border-t border-slate-200 bg-white px-4 py-4 shadow-lg space-y-2">
        <button
          type="submit"
          disabled={!hasItems || isSubmitting}
          className="flex w-full h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Procesando...
            </>
          ) : (
            <>
              Guardar venta
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="w-full h-10 rounded-xl border border-slate-300 bg-white text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
