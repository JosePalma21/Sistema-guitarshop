"use client"

import { useMemo, useState } from "react"
import { isAxiosError } from "axios"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  Building2,
  CalendarClock,
  Edit2,
  Loader2,
  Mail,
  Phone,
  Plus,
  ShieldAlert,
  Trash2,
} from "lucide-react"

import { api } from "../../lib/apiClient"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { useAuthUser } from "../../lib/hooks/useAuthUser"

type ProveedorRecord = {
  id_proveedor: number
  nombre_proveedor: string
  ruc_cedula: string
  correo: string | null
  telefono: string | null
  direccion: string | null
  fecha_registro: string
}

const proveedorSchema = z.object({
  nombre_proveedor: z.string().trim().min(3, "El nombre es obligatorio").max(100, "Máximo 100 caracteres"),
  ruc_cedula: z
    .string()
    .trim()
    .regex(/^\d{10,13}$/, "Debe tener entre 10 y 13 dígitos"),
  correo: z
    .string()
    .trim()
    .max(120, "Máximo 120 caracteres")
    .email("Correo no válido")
    .optional()
    .or(z.literal("")),
  telefono: z
    .string()
    .trim()
    .regex(/^[0-9+\-\s]{7,20}$/i, "Teléfono no válido")
    .optional()
    .or(z.literal("")),
  direccion: z
    .string()
    .trim()
    .max(150, "Máximo 150 caracteres")
    .optional()
    .or(z.literal("")),
})

type ProveedorFormValues = z.infer<typeof proveedorSchema>

type ProveedorPayload = {
  nombre_proveedor: string
  ruc_cedula: string
  correo: string | null
  telefono: string | null
  direccion: string | null
}

type ApiErrorResponse = {
  error?: string
  message?: string
}

const defaultValues: ProveedorFormValues = {
  nombre_proveedor: "",
  ruc_cedula: "",
  correo: "",
  telefono: "",
  direccion: "",
}

const dateFormatter = new Intl.DateTimeFormat("es-EC", { dateStyle: "medium" })

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.error ?? error.response?.data?.message ?? fallback
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

export default function ProveedoresPage() {
  const { isAdmin } = useAuthUser()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<ProveedorRecord | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const form = useForm<ProveedorFormValues>({
    resolver: zodResolver(proveedorSchema),
    defaultValues,
  })

  const proveedoresQuery = useQuery<ProveedorRecord[]>({
    queryKey: ["proveedores"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await api.get<ProveedorRecord[]>("/proveedor")
      return Array.isArray(data) ? data : []
    },
  })

  const closeDialog = () => {
    setDialogOpen(false)
    setEditingProvider(null)
    setFormError(null)
    form.reset(defaultValues)
  }

  const openCreate = () => {
    setEditingProvider(null)
    setFormError(null)
    form.reset(defaultValues)
    setDialogOpen(true)
  }

  const openEdit = (proveedor: ProveedorRecord) => {
    setEditingProvider(proveedor)
    setFormError(null)
    form.reset({
      nombre_proveedor: proveedor.nombre_proveedor,
      ruc_cedula: proveedor.ruc_cedula,
      correo: proveedor.correo ?? "",
      telefono: proveedor.telefono ?? "",
      direccion: proveedor.direccion ?? "",
    })
    setDialogOpen(true)
  }

  const buildPayload = (values: ProveedorFormValues): ProveedorPayload => ({
    nombre_proveedor: values.nombre_proveedor.trim(),
    ruc_cedula: values.ruc_cedula.trim(),
    correo: values.correo?.trim() ? values.correo.trim() : null,
    telefono: values.telefono?.trim() ? values.telefono.trim() : null,
    direccion: values.direccion?.trim() ? values.direccion.trim() : null,
  })

  const createMutation = useMutation({
    mutationFn: (payload: ProveedorPayload) => api.post("/proveedor", payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] })
      closeDialog()
    },
    onError: (error: unknown) => {
      setFormError(getApiErrorMessage(error, "No se pudo crear el proveedor"))
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ProveedorPayload }) =>
      api.put(`/proveedor/${id}`, payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proveedores"] })
      closeDialog()
    },
    onError: (error: unknown) => {
      setFormError(getApiErrorMessage(error, "No se pudo actualizar el proveedor"))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/proveedor/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["proveedores"] }),
    onError: (error: unknown) => {
      const message = getApiErrorMessage(
        error,
        "No se pudo eliminar el proveedor. Verifica si tiene compras o productos asociados."
      )
      window.alert(message)
    },
  })

  const onSubmit = form.handleSubmit((values) => {
    const payload = buildPayload(values)
    if (editingProvider) {
      updateMutation.mutate({ id: editingProvider.id_proveedor, payload })
    } else {
      createMutation.mutate(payload)
    }
  })

  const handleDelete = (proveedor: ProveedorRecord) => {
    if (deleteMutation.isPending) return
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar a ${proveedor.nombre_proveedor}? Esta acción es permanente.`
    )
    if (confirmed) {
      deleteMutation.mutate(proveedor.id_proveedor)
    }
  }

  const proveedores = useMemo(() => proveedoresQuery.data ?? [], [proveedoresQuery.data])
  const totalConCorreo = useMemo(() => proveedores.filter((p) => !!p.correo).length, [proveedores])
  const totalConTelefono = useMemo(() => proveedores.filter((p) => !!p.telefono).length, [proveedores])
  const recientes = useMemo(() => proveedores.slice(-4).reverse(), [proveedores])

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-3 text-amber-800">
          <ShieldAlert className="h-5 w-5" />
          <div>
            <p className="font-semibold">Acceso restringido</p>
            <p className="text-sm">Solo administradores pueden gestionar proveedores.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Cadena de suministro</p>
          <h1 className="text-3xl font-semibold text-slate-900">Proveedores</h1>
          <p className="mt-1 text-sm text-slate-500">Controla contactos y documentación desde un solo lugar.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo proveedor
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase text-slate-500">Total registrados</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{proveedores.length}</p>
          <p className="text-sm text-slate-500">Activos según la base de datos</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase text-slate-500">Con correo verificado</p>
          <p className="mt-2 text-3xl font-semibold text-blue-600">{totalConCorreo}</p>
          <p className="text-sm text-slate-500">Contactos listos para campañas</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase text-slate-500">Con teléfono</p>
          <p className="mt-2 text-3xl font-semibold text-purple-600">{totalConTelefono}</p>
          <p className="text-sm text-slate-500">Disponibles para seguimiento</p>
        </article>
      </section>

      {proveedoresQuery.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            Error al cargar proveedores. Intenta nuevamente.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Proveedor</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Dirección</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {proveedores.map((proveedor) => (
                  <tr key={proveedor.id_proveedor} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">{proveedor.nombre_proveedor}</p>
                      <p className="text-xs text-slate-500">RUC/Cédula: {proveedor.ruc_cedula}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {proveedor.correo ?? "Sin correo"}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {proveedor.telefono ?? "Sin teléfono"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      {proveedor.direccion ?? "Sin dirección"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(proveedor)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(proveedor)}
                          className="rounded-lg border border-red-200 p-2 text-red-600 transition hover:bg-red-50"
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {proveedoresQuery.isLoading && (
            <div className="flex items-center justify-center gap-2 p-6 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando proveedores...
            </div>
          )}
          {!proveedoresQuery.isLoading && proveedores.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <Building2 size={36} className="mx-auto mb-2 opacity-50" />
              <p>No hay proveedores registrados.</p>
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Ingresos recientes</h2>
              <p className="text-sm text-slate-500">Últimas altas en el sistema.</p>
            </div>
            <CalendarClock className="h-5 w-5 text-slate-400" />
          </div>
          {recientes.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no registras proveedores.</p>
          ) : (
            <ul className="space-y-3">
              {recientes.map((prov) => (
                <li key={prov.id_proveedor} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                  <p className="font-medium text-slate-900">{prov.nombre_proveedor}</p>
                  <p className="text-xs text-slate-500">
                    {dateFormatter.format(new Date(prov.fecha_registro))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            closeDialog()
          } else {
            setDialogOpen(true)
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingProvider ? "Editar proveedor" : "Nuevo proveedor"}</DialogTitle>
            <DialogDescription>Todos los campos serán validados con las reglas del backend.</DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
          )}

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Nombre del proveedor</label>
                <input
                  {...form.register("nombre_proveedor")}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {form.formState.errors.nombre_proveedor && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.nombre_proveedor.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">RUC / Cédula</label>
                <input
                  {...form.register("ruc_cedula")}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="13 dígitos"
                />
                {form.formState.errors.ruc_cedula && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.ruc_cedula.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Correo</label>
                <input
                  type="email"
                  {...form.register("correo")}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="proveedor@empresa.com"
                />
                {form.formState.errors.correo && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.correo.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Teléfono</label>
                <input
                  type="tel"
                  {...form.register("telefono")}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="0999999999"
                />
                {form.formState.errors.telefono && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.telefono.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium uppercase text-slate-500">Dirección</label>
              <textarea
                rows={3}
                {...form.register("direccion")}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Ciudad, calle, referencia"
              />
              {form.formState.errors.direccion && (
                <p className="mt-1 text-xs text-red-600">{form.formState.errors.direccion.message}</p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="h-4 w-4 animate-spin" />}
                Guardar
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
