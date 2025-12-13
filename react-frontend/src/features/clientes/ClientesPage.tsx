"use client"

import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { isAxiosError } from "axios"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  CalendarClock,
  Edit2,
  IdCard,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  ShieldAlert,
  Trash2,
  Users,
} from "lucide-react"

import { api } from "../../lib/apiClient"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { useAuthUser } from "../../lib/hooks/useAuthUser"

type ClienteRecord = {
  id_cliente: number
  nombres: string
  apellidos: string
  cedula: string
  correo: string | null
  telefono: string | null
  direccion: string | null
  fecha_registro: string
}

// Este esquema replica las reglas de Prisma para evitar rechazos en el backend.
const clienteSchema = z.object({
  nombres: z.string().trim().min(3, "Mínimo 3 caracteres").max(60, "Máximo 60 caracteres"),
  apellidos: z.string().trim().min(3, "Mínimo 3 caracteres").max(60, "Máximo 60 caracteres"),
  cedula: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Debe tener 10 dígitos"),
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

type ClienteFormValues = z.infer<typeof clienteSchema>

type ClientePayload = {
  nombres: string
  apellidos: string
  cedula: string
  correo: string | null
  telefono: string | null
  direccion: string | null
}

type ApiErrorResponse = {
  error?: string
  message?: string
}

// Estado base del formulario para abrir/cerrar el modal sin residuos.
const defaultValues: ClienteFormValues = {
  nombres: "",
  apellidos: "",
  cedula: "",
  correo: "",
  telefono: "",
  direccion: "",
}

// Fechas de alta compactas para la tarjeta de "Altas recientes".
const dateFormatter = new Intl.DateTimeFormat("es-EC", { dateStyle: "medium" })

// Centralizamos la lectura del error HTTP para mostrar el mensaje humano.
const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (isAxiosError<ApiErrorResponse>(error)) {
    return error.response?.data?.error ?? error.response?.data?.message ?? fallback
  }
  if (error instanceof Error) {
    return error.message
  }
  return fallback
}

export default function ClientesPage() {
  const { isAdmin } = useAuthUser()
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<ClienteRecord | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  // React Hook Form + Zod gobiernan todas las reglas de entrada.
  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues,
  })

  // Trae la tabla completa sólo si el usuario tiene rol ADMIN.
  const clientesQuery = useQuery<ClienteRecord[]>({
    queryKey: ["clientes"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data } = await api.get<ClienteRecord[]>("/cliente")
      return Array.isArray(data) ? data : []
    },
  })

  // Reutilizamos este helper cada vez que se cierra el modal.
  const closeDialog = () => {
    setDialogOpen(false)
    setEditingClient(null)
    setFormError(null)
    form.reset(defaultValues)
  }

  // Prepara el formulario vacío para un alta nueva.
  const openCreate = () => {
    setEditingClient(null)
    setFormError(null)
    form.reset(defaultValues)
    setDialogOpen(true)
  }

  // Carga un cliente existente dentro del modal para editarlo inline.
  const openEdit = (cliente: ClienteRecord) => {
    setEditingClient(cliente)
    setFormError(null)
    form.reset({
      nombres: cliente.nombres,
      apellidos: cliente.apellidos,
      cedula: cliente.cedula,
      correo: cliente.correo ?? "",
      telefono: cliente.telefono ?? "",
      direccion: cliente.direccion ?? "",
    })
    setDialogOpen(true)
  }

  // Normalizamos strings antes de enviarlos al backend.
  const buildPayload = (values: ClienteFormValues): ClientePayload => ({
    nombres: values.nombres.trim(),
    apellidos: values.apellidos.trim(),
    cedula: values.cedula.trim(),
    correo: values.correo?.trim() ? values.correo.trim() : null,
    telefono: values.telefono?.trim() ? values.telefono.trim() : null,
    direccion: values.direccion?.trim() ? values.direccion.trim() : null,
  })

  // POST /cliente: invalida la lista y cierra el modal.
  const createMutation = useMutation({
    mutationFn: (payload: ClientePayload) => api.post("/cliente", payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] })
      closeDialog()
    },
    onError: (error: unknown) => {
      setFormError(getApiErrorMessage(error, "No se pudo crear el cliente"))
    },
  })

  // PUT /cliente/:id para ediciones puntuales.
  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ClientePayload }) =>
      api.put(`/cliente/${id}`, payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] })
      closeDialog()
    },
    onError: (error: unknown) => {
      setFormError(getApiErrorMessage(error, "No se pudo actualizar el cliente"))
    },
  })

  // DELETE /cliente/:id; si falla avisamos con alert para no bloquear el flujo.
  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/cliente/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["clientes"] }),
    onError: (error: unknown) => {
      const message = getApiErrorMessage(error, "No se pudo eliminar el cliente")
      window.alert(message)
    },
  })

  // El mismo formulario sirve para crear o actualizar según haya cliente en edición.
  const onSubmit = form.handleSubmit((values) => {
    const payload = buildPayload(values)
    if (editingClient) {
      updateMutation.mutate({ id: editingClient.id_cliente, payload })
    } else {
      createMutation.mutate(payload)
    }
  })

  // Confirmación clásica para evitar borrar registros sensibles sin querer.
  const handleDelete = (cliente: ClienteRecord) => {
    if (deleteMutation.isPending) return
    const confirmed = window.confirm(
      `¿Seguro que deseas eliminar a ${cliente.nombres} ${cliente.apellidos}? Esta acción es permanente.`,
    )
    if (confirmed) {
      deleteMutation.mutate(cliente.id_cliente)
    }
  }

  const clientes = useMemo(() => clientesQuery.data ?? [], [clientesQuery.data])
  const totalConCorreo = useMemo(() => clientes.filter((c) => !!c.correo).length, [clientes])
  const totalConTelefono = useMemo(() => clientes.filter((c) => !!c.telefono).length, [clientes])
  const recientes = useMemo(() => clientes.slice(-4).reverse(), [clientes])

  if (!isAdmin) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-center gap-3 text-amber-800">
          <ShieldAlert className="h-5 w-5" />
          <div>
            <p className="font-semibold">Acceso restringido</p>
            <p className="text-sm">Solo administradores pueden gestionar clientes.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">Relaciones comerciales</p>
          <h1 className="text-3xl font-semibold text-slate-900">Clientes</h1>
          <p className="mt-1 text-sm text-slate-500">Centraliza datos de contacto y seguimiento.</p>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </button>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase text-slate-500">Total registrados</p>
          <div className="mt-2 flex items-end gap-3">
            <Users className="h-8 w-8 text-emerald-500" />
            <p className="text-3xl font-semibold text-slate-900">{clientes.length}</p>
          </div>
          <p className="text-sm text-slate-500">Activos en la base de datos</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase text-slate-500">Con correo</p>
          <div className="mt-2 flex items-end gap-3">
            <Mail className="h-8 w-8 text-blue-500" />
            <p className="text-3xl font-semibold text-slate-900">{totalConCorreo}</p>
          </div>
          <p className="text-sm text-slate-500">Listos para campañas</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-xs uppercase text-slate-500">Con teléfono</p>
          <div className="mt-2 flex items-end gap-3">
            <Phone className="h-8 w-8 text-purple-500" />
            <p className="text-3xl font-semibold text-slate-900">{totalConTelefono}</p>
          </div>
          <p className="text-sm text-slate-500">Disponibles para seguimientos</p>
        </article>
      </section>

      {clientesQuery.isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="flex items-center gap-2 font-medium">
            <AlertCircle className="h-4 w-4" />
            Error al cargar clientes. Intenta nuevamente.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Cliente</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Identificación</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Contacto</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Dirección</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {clientes.map((cliente) => (
                  <tr key={cliente.id_cliente} className="hover:bg-slate-50">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-900">
                        {cliente.nombres} {cliente.apellidos}
                      </p>
                      <p className="text-xs text-slate-500">Cliente #{cliente.id_cliente}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <IdCard className="h-4 w-4 text-slate-400" />
                        {cliente.cedula}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {cliente.correo ?? "Sin correo"}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <Phone className="h-4 w-4 text-slate-400" />
                        {cliente.telefono ?? "Sin teléfono"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-700">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {cliente.direccion ?? "Sin dirección"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => openEdit(cliente)}
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(cliente)}
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
          {clientesQuery.isLoading && (
            <div className="flex items-center justify-center gap-2 p-6 text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando clientes...
            </div>
          )}
          {!clientesQuery.isLoading && clientes.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <Users size={36} className="mx-auto mb-2 opacity-50" />
              <p>No hay clientes registrados.</p>
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Altas recientes</h2>
              <p className="text-sm text-slate-500">Últimas incorporaciones al CRM.</p>
            </div>
            <CalendarClock className="h-5 w-5 text-slate-400" />
          </div>
          {recientes.length === 0 ? (
            <p className="text-sm text-slate-500">Aún no registras clientes.</p>
          ) : (
            <ul className="space-y-3">
              {recientes.map((cliente) => (
                <li key={cliente.id_cliente} className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-sm">
                  <p className="font-medium text-slate-900">
                    {cliente.nombres} {cliente.apellidos}
                  </p>
                  <p className="text-xs text-slate-500">{dateFormatter.format(new Date(cliente.fecha_registro))}</p>
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
            <DialogTitle>{editingClient ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
            <DialogDescription>Todos los campos cumplen las mismas reglas de la base de datos.</DialogDescription>
          </DialogHeader>

          {formError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{formError}</div>
          )}

          <form onSubmit={onSubmit} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Nombres</label>
                <input
                  {...form.register("nombres")}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {form.formState.errors.nombres && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.nombres.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Apellidos</label>
                <input
                  {...form.register("apellidos")}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {form.formState.errors.apellidos && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.apellidos.message}</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Cédula</label>
                <input
                  {...form.register("cedula")}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {form.formState.errors.cedula && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.cedula.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Correo electrónico</label>
                <input
                  {...form.register("correo")}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {form.formState.errors.correo && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.correo.message}</p>
                )}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Teléfono</label>
                <input
                  {...form.register("telefono")}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {form.formState.errors.telefono && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.telefono.message}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-medium uppercase text-slate-500">Dirección</label>
                <input
                  {...form.register("direccion")}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                {form.formState.errors.direccion && (
                  <p className="mt-1 text-xs text-red-600">{form.formState.errors.direccion.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row">
              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {editingClient ? "Guardar cambios" : "Crear cliente"}
              </button>
              <button
                type="button"
                onClick={closeDialog}
                className="inline-flex flex-1 items-center justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
