"use client"

import { formatMoney } from "../../../utils/number"
import type { VentaDetailRecord } from "../../../services/salesService"

const dateFormatter = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeStyle: "short",
})

type Props = {
  sale: VentaDetailRecord
}

export function InvoiceView({ sale }: Props) {
  const clienteNombre = sale.cliente ? `${sale.cliente.nombres} ${sale.cliente.apellidos}` : "—"
  const fecha = sale.fecha_factura ? dateFormatter.format(new Date(sale.fecha_factura)) : "—"

  return (
    <div className="printable-invoice rounded-2xl border border-slate-200 bg-white p-6 text-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Factura</h2>
          <p className="mt-1 text-sm text-slate-600">N° {sale.numero_factura || "—"}</p>
          <p className="text-sm text-slate-600">Fecha: {fecha}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold">Cliente</p>
          <p className="text-sm text-slate-700">{clienteNombre}</p>
          <p className="text-sm text-slate-600">Cédula: {sale.cliente?.cedula ?? "—"}</p>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2">Código</th>
              <th className="py-2">Producto</th>
              <th className="py-2 text-right">Cant.</th>
              <th className="py-2 text-right">Precio</th>
              <th className="py-2 text-right">Desc.</th>
              <th className="py-2 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {sale.detalle_factura.map((line) => (
              <tr key={line.id_detalle_factura} className="border-b border-slate-100">
                <td className="py-2 text-slate-600">{line.producto?.codigo_producto ?? ""}</td>
                <td className="py-2">
                  <p className="font-medium text-slate-900">{line.producto?.nombre_producto ?? ""}</p>
                </td>
                <td className="py-2 text-right">{line.cantidad}</td>
                <td className="py-2 text-right">{formatMoney(line.precio_unitario)}</td>
                <td className="py-2 text-right">{formatMoney(line.descuento)}</td>
                <td className="py-2 text-right font-semibold">{formatMoney(line.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 ml-auto w-full max-w-sm rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-slate-600">Subtotal</span>
          <span className="font-medium text-slate-900">{formatMoney(sale.subtotal)}</span>
        </div>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-slate-600">IVA</span>
          <span className="font-medium text-slate-900">{formatMoney(sale.impuesto)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatMoney(sale.total)}</span>
        </div>
      </div>
    </div>
  )
}
