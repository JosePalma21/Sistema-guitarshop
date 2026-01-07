"use client"

import { formatMoney } from "../../../utils/number"
import type { VentaDetailRecord } from "../../../services/salesService"

type Props = {
  sale: VentaDetailRecord
}

export function SaleInvoicePrintable({ sale }: Props) {
  const clienteNombre = sale.cliente
    ? `${sale.cliente.nombres} ${sale.cliente.apellidos}`.toUpperCase()
    : "CONSUMIDOR FINAL"
  const clienteCedula = sale.cliente?.cedula || "9999999999"
  const fecha = sale.fecha_factura
    ? new Date(sale.fecha_factura).toLocaleDateString("es-EC", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : ""
  const hora = sale.fecha_factura
    ? new Date(sale.fecha_factura).toLocaleTimeString("es-EC", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : ""

  const subtotal0 = 0
  const subtotal15 = sale.subtotal || 0
  const iva15 = sale.impuesto || 0
  const total = sale.total || 0

  return (
    <div className="printable-invoice mx-auto max-w-3xl bg-white p-8 text-black">
      {/* ENCABEZADO */}
      <div className="border-b border-black pb-4 text-center">
        <h1 className="text-lg font-bold uppercase">GUITARSHOP</h1>
        <p className="text-xs">RUC: 1234567890001</p>
        <p className="text-xs">Av. Principal #123 y Secundaria</p>
        <p className="text-xs">Telf: 02-2345678 / 0998765432</p>
        <p className="text-xs">Quito - Ecuador</p>
      </div>

      {/* TÍTULO DOCUMENTO */}
      <div className="mt-4 text-center">
        <h2 className="text-base font-bold uppercase">NOTA DE ENTREGA</h2>
      </div>

      {/* DATOS DEL COMPROBANTE */}
      <div className="mt-4 border border-black p-2 text-xs">
        <div className="flex justify-between">
          <span>Ticket No:</span>
          <span className="font-bold">{sale.numero_factura || "001-000000"}</span>
        </div>
        <div className="flex justify-between">
          <span>Fecha:</span>
          <span>{fecha}</span>
        </div>
        <div className="flex justify-between">
          <span>Hora:</span>
          <span>{hora}</span>
        </div>
        <div className="flex justify-between">
          <span>Atendido por:</span>
          <span>{sale.usuario?.nombre_completo || "SISTEMA"}</span>
        </div>
        <div className="flex justify-between">
          <span>Forma de Pago:</span>
          <span>{sale.forma_pago || "EFECTIVO"}</span>
        </div>
      </div>

      {/* DATOS DEL CLIENTE */}
      <div className="mt-3 border border-black p-2 text-xs">
        <div className="flex">
          <span className="font-bold">Nombre:</span>
          <span className="ml-2">{clienteNombre}</span>
        </div>
        <div className="flex">
          <span className="font-bold">Dirección:</span>
          <span className="ml-2">—</span>
        </div>
        <div className="flex">
          <span className="font-bold">Cédula/RUC:</span>
          <span className="ml-2">{clienteCedula}</span>
        </div>
      </div>

      {/* TABLA DE PRODUCTOS */}
      <div className="mt-4">
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="border-b border-black text-left uppercase">
              <th className="py-1 pr-1">Cant.</th>
              <th className="py-1 pr-1">Unid.</th>
              <th className="py-1 pr-2">Descripción de Artículo</th>
              <th className="py-1 pr-1 text-right">Val. Unit.</th>
              <th className="py-1 text-right">Valor T.</th>
            </tr>
          </thead>
          <tbody>
            {sale.detalle_factura.map((line, index) => (
              <tr key={line.id_detalle_factura || index} className="border-b border-gray-300">
                <td className="py-1 pr-1 align-top">{line.cantidad}</td>
                <td className="py-1 pr-1 align-top">UND</td>
                <td className="py-1 pr-2 align-top">
                  <div className="break-words">
                    {line.producto?.nombre_producto || "—"}
                    <br />
                    <span className="text-[9px] text-black">
                      Cód: {line.producto?.codigo_producto || "—"}
                    </span>
                  </div>
                </td>
                <td className="py-1 pr-1 text-right align-top tabular-nums">
                  {formatMoney(line.precio_unitario)}
                </td>
                <td className="py-1 text-right align-top tabular-nums font-medium">
                  {formatMoney(line.subtotal)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTALES */}
      <div className="mt-4 ml-auto w-64 border border-black p-2 text-xs">
        <div className="flex justify-between">
          <span>SUBTOTAL:</span>
          <span className="tabular-nums">{formatMoney(subtotal15)}</span>
        </div>
        <div className="flex justify-between">
          <span>IVA 0%:</span>
          <span className="tabular-nums">{formatMoney(subtotal0)}</span>
        </div>
        <div className="flex justify-between">
          <span>IVA 15%:</span>
          <span className="tabular-nums">{formatMoney(iva15)}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-black pt-1 font-bold">
          <span>TOTAL:</span>
          <span className="tabular-nums">{formatMoney(total)}</span>
        </div>
      </div>

      {/* PIE DE PÁGINA */}
      <div className="mt-6 space-y-6 text-xs">
        <div className="flex justify-between">
          <div className="w-1/2 text-center">
            <div className="border-t border-black pt-1">Firma Responsable</div>
          </div>
          <div className="w-1/2 text-center">
            <div className="border-t border-black pt-1">Firma Cliente</div>
          </div>
        </div>
        <div className="border border-black p-2 text-center font-bold">
          SALIDA LA MERCADERÍA NO SE ACEPTAN DEVOLUCIONES
        </div>
      </div>
    </div>
  )
}
