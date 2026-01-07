"use client"

import type { UseFormReturn } from "react-hook-form"
import type { SaleCreateFormValues } from "./SaleItemsTable"
import type { ClienteOption } from "../types"
import { SaleClientAutocomplete } from "./SaleClientAutocomplete"

type Props = {
  form: UseFormReturn<SaleCreateFormValues>
  clientes: ClienteOption[]
  clientesLoading?: boolean
}

export function SaleTopBar({ form, clientes, clientesLoading }: Props) {
  return (
    <div className="border-b border-slate-200 bg-white px-8 py-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <SaleClientAutocomplete
            clientes={clientes}
            disabled={clientesLoading}
            onSelectCliente={(cliente) => {
              if (cliente) {
                form.setValue("id_cliente", cliente.id_cliente, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            }}
            onSelectConsumidorFinal={() => {
              form.setValue("id_cliente", 0, {
                shouldValidate: false,
                shouldDirty: true,
              })
            }}
          />
        </div>

        <div>
          <label className="text-xs font-medium uppercase text-slate-500">Observaciones</label>
          <input
            type="text"
            {...form.register("observacion")}
            placeholder="Detalles adicionales (opcional)"
            className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </div>
    </div>
  )
}
