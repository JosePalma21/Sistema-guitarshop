"use client"

import { Minus, Plus, Trash2 } from "lucide-react"
import { formatMoney } from "../../../utils/number"
import type { ProductoOption } from "../types"

type Props = {
  product: ProductoOption | undefined
  quantity: number
  price: number
  subtotal: number
  stockExceeded: boolean
  stock: number | null
  onIncrement: () => void
  onDecrement: () => void
  onRemove: () => void
}

export function SaleItemRow({
  product,
  quantity,
  price,
  subtotal,
  stockExceeded,
  stock,
  onIncrement,
  onDecrement,
  onRemove,
}: Props) {
  return (
    <div className="group flex items-center gap-2 border-b border-slate-100 py-2 hover:bg-slate-50">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-slate-900" title={product?.nombre_producto}>
          {product?.nombre_producto ?? "—"}
        </p>
        {stockExceeded && (
          <p className="text-xs text-red-600">Stock insuficiente (disp: {stock})</p>
        )}
      </div>

      <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white">
        <button
          type="button"
          onClick={onDecrement}
          disabled={quantity <= 1}
          className="inline-flex h-7 w-7 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <span className="inline-flex h-7 w-10 items-center justify-center text-sm font-bold text-slate-900">
          {quantity}
        </span>
        <button
          type="button"
          onClick={onIncrement}
          disabled={stock !== null && quantity >= stock}
          className="inline-flex h-7 w-7 items-center justify-center text-slate-600 hover:bg-slate-50 disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      <span className="w-20 text-right text-sm text-slate-700">{formatMoney(price)}</span>

      <span className="w-24 text-right text-sm font-bold text-slate-900">{formatMoney(subtotal)}</span>

      <button
        type="button"
        onClick={onRemove}
        className="inline-flex h-7 w-7 items-center justify-center rounded text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-600 group-hover:opacity-100"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}
