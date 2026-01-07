import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import type { jsPDF as JsPdfType } from "jspdf"

import type { VentaDetailRecord } from "../../../services/salesService"
import { formatMoney } from "../../../utils/number"

const dateFormatter = new Intl.DateTimeFormat("es-EC", {
  dateStyle: "medium",
  timeStyle: "short",
})

export function downloadSalePdf(venta: VentaDetailRecord) {
  const doc = new jsPDF({ unit: "pt", format: "a4" })

  const marginX = 40
  let y = 50

  doc.setFontSize(16)
  doc.text("Factura", marginX, y)

  doc.setFontSize(10)
  y += 18
  doc.text(`N°: ${venta.numero_factura || "—"}`, marginX, y)

  y += 14
  doc.text(`Fecha: ${venta.fecha_factura ? dateFormatter.format(new Date(venta.fecha_factura)) : "—"}`, marginX, y)

  y += 14
  const clienteNombre = venta.cliente ? `${venta.cliente.nombres} ${venta.cliente.apellidos}` : "—"
  doc.text(`Cliente: ${clienteNombre}`, marginX, y)

  y += 14
  doc.text(`Cédula: ${venta.cliente?.cedula ?? "—"}`, marginX, y)

  y += 22

  const head = [["Código", "Producto", "Cant.", "Precio", "Desc.", "Subtotal"]]
  const body = (venta.detalle_factura ?? []).map((line) => [
    line.producto?.codigo_producto ?? "",
    line.producto?.nombre_producto ?? "",
    String(line.cantidad ?? 0),
    formatMoney(line.precio_unitario ?? 0),
    formatMoney(line.descuento ?? 0),
    formatMoney(line.subtotal ?? 0),
  ])

  autoTable(doc, {
    startY: y,
    head,
    body,
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [15, 23, 42] },
    columnStyles: {
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
    },
  })

  type DocWithAutoTable = JsPdfType & { lastAutoTable?: { finalY?: number } }
  const finalY = (doc as DocWithAutoTable).lastAutoTable?.finalY ?? y + 200

  doc.setFontSize(10)
  doc.text(`Subtotal: ${formatMoney(venta.subtotal ?? 0)}`, marginX, finalY + 24)
  doc.text(`IVA: ${formatMoney(venta.impuesto ?? 0)}`, marginX, finalY + 40)
  doc.setFontSize(12)
  doc.text(`Total: ${formatMoney(venta.total ?? 0)}`, marginX, finalY + 60)

  const safeNumero = (venta.numero_factura || "venta").replace(/[^a-zA-Z0-9-_]/g, "_")
  doc.save(`Factura_${safeNumero}.pdf`)
}
