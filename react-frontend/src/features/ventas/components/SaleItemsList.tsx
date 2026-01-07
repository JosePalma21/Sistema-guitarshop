"use client"

import { SaleItemRow } from "./SaleItemRow"
import type { SaleCreateFormValues } from "./SaleItemsTable"
import type { ProductoOption } from "../types"
import { calcLineTotal } from "../../../modules/ventas/utils/salesCalc"
import { toNumberSafe } from "../../../utils/number"

type Props = {
  items: SaleCreateFormValues["detalle"]
  productosMap: Map<number, ProductoOption>
  onIncrement: (index: number) => void
  onDecrement: (index: number) => void
  onRemove: (index: number) => void
}

export function SaleItemsList({ items, productosMap, onIncrement, onDecrement, onRemove }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-slate-400">
        <p className="text-sm font-medium">No hay productos agregados</p>
        <p className="mt-1 text-xs">Busca y agrega productos para comenzar</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto px-4">
      {items.map((line, index) => {
        const product = productosMap.get(line?.id_producto ?? 0)
        const qty = Math.trunc(toNumberSafe(line?.cantidad))
        const price = toNumberSafe(line?.precio_unitario)
        const stock = product?.cantidad_stock ?? null
        const stockExceeded = stock !== null && qty > stock
        const lineTotal = calcLineTotal(line?.precio_unitario, line?.cantidad, line?.descuento)

        return (
          <SaleItemRow
            key={index}
            product={product}
            quantity={qty}
            price={price}
            subtotal={lineTotal}
            stockExceeded={stockExceeded}
            stock={stock}
            onIncrement={() => onIncrement(index)}
            onDecrement={() => onDecrement(index)}
            onRemove={() => onRemove(index)}
          />
        )
      })}
    </div>
  )
}
