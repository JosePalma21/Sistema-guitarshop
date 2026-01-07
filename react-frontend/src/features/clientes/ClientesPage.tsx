"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { isAxiosError } from "axios"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import {
	AlertCircle,
	Edit2,
	Loader2,
	Mail,
	MapPin,
	Phone,
	Trash2,
	Users,
} from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../components/ui/dialog"
import { api } from "../../lib/apiClient"
import { useDebouncedValue } from "../../lib/hooks/useDebouncedValue"

import type { ClientesFilters, ClientesViewMode } from "./cliente.types"
import type { ClientePayload, ClienteRecord } from "./cliente.types"
import { clienteClient } from "./cliente.client"
import { matchesClienteSearch } from "./cliente.utils"
import { clientesQueryKey, useClientesQuery } from "./useClientesQuery"
import { exportToCSV, exportToXLSX, exportToPDF, type ExportRow } from "./exportClientes"

import { ClientesFiltersDrawer } from "./components/ClientesFiltersDrawer"
import { ClientesListHeader } from "./components/ClientesListHeader"
import { ClientesDetailDrawer } from "./components/ClientesDetailDrawer"

type ApiErrorResponse = {
	error?: string
	message?: string
}

const PAGE_SIZE_STORAGE_KEY = "clientes.pageSize"
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const
type PageSizeOption = (typeof PAGE_SIZE_OPTIONS)[number]
const DEFAULT_PAGE_SIZE: PageSizeOption = 25

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

const dateFormatter = new Intl.DateTimeFormat("es-EC", {
	dateStyle: "medium",
})

const defaultValues: ClienteFormValues = {
	nombres: "",
	apellidos: "",
	cedula: "",
	correo: "",
	telefono: "",
	direccion: "",
}

const defaultFilters: ClientesFilters = {
	orden: "name_asc",
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
	if (isAxiosError<ApiErrorResponse>(error)) {
		return error.response?.data?.error ?? error.response?.data?.message ?? fallback
	}
	return fallback
}

export default function ClientesPage() {
	const queryClient = useQueryClient()

	const [pageSize, setPageSize] = useState<PageSizeOption>(() => {
		const stored = localStorage.getItem(PAGE_SIZE_STORAGE_KEY)
		if (stored) {
			const parsed = Number(stored) as PageSizeOption
			if (PAGE_SIZE_OPTIONS.includes(parsed)) return parsed
		}
		return DEFAULT_PAGE_SIZE
	})

	const [currentPage, setCurrentPage] = useState(1)
	const [searchInput, setSearchInput] = useState("")
	const [filters, setFilters] = useState<ClientesFilters>(defaultFilters)
	const [viewMode, setViewMode] = useState<ClientesViewMode>("table")

	const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false)
	const [createDialogOpen, setCreateDialogOpen] = useState(false)
	const [editDialogOpen, setEditDialogOpen] = useState(false)
	const [detailDrawerOpen, setDetailDrawerOpen] = useState(false)
	const [exportDialogOpen, setExportDialogOpen] = useState(false)

	const [exportScope, setExportScope] = useState<"page" | "filtered" | "all">("filtered")
	const [exportFormat, setExportFormat] = useState<"csv" | "xlsx" | "pdf">("xlsx")
	const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "done">("idle")
	const [exportError, setExportError] = useState<string | null>(null)

	const [selectedCliente, setSelectedCliente] = useState<ClienteRecord | null>(null)
	const [editingCliente, setEditingCliente] = useState<ClienteRecord | null>(null)

	const debouncedSearch = useDebouncedValue(searchInput, 300)

	const clientesQuery = useClientesQuery()
	const clientes = useMemo(() => clientesQuery.data ?? [], [clientesQuery.data])

	const createMutation = useMutation({
		mutationFn: (payload: ClientePayload) => clienteClient.create(payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: clientesQueryKey })
			setCreateDialogOpen(false)
			form.reset(defaultValues)
		},
	})

	const updateMutation = useMutation({
		mutationFn: ({ id, payload }: { id: number; payload: ClientePayload }) =>
			clienteClient.update(id, payload),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: clientesQueryKey })
			setEditDialogOpen(false)
			setEditingCliente(null)
			editForm.reset(defaultValues)
		},
	})

	const deleteMutation = useMutation({
		mutationFn: (id: number) => clienteClient.remove(id),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: clientesQueryKey })
		},
	})

	const form = useForm<ClienteFormValues>({
		resolver: zodResolver(clienteSchema),
		defaultValues,
	})

	const editForm = useForm<ClienteFormValues>({
		resolver: zodResolver(clienteSchema),
		defaultValues,
	})

	useEffect(() => {
		localStorage.setItem(PAGE_SIZE_STORAGE_KEY, String(pageSize))
	}, [pageSize])

	useEffect(() => {
		setCurrentPage(1)
	}, [debouncedSearch, filters, pageSize])

	const filteredClientes = useMemo(() => {
		if (!clientesQuery.data) return []

		let result = clientesQuery.data.filter((cliente) => matchesClienteSearch(cliente, debouncedSearch))

		// Aplicar ordenamiento
		result.sort((a, b) => {
			switch (filters.orden) {
				case "name_asc":
					return a.nombres.localeCompare(b.nombres) || a.apellidos.localeCompare(b.apellidos)
				case "name_desc":
					return b.nombres.localeCompare(a.nombres) || b.apellidos.localeCompare(a.apellidos)
				case "date_asc":
					return new Date(a.fecha_registro).getTime() - new Date(b.fecha_registro).getTime()
				case "date_desc":
					return new Date(b.fecha_registro).getTime() - new Date(a.fecha_registro).getTime()
				default:
					return 0
			}
		})

		return result
	}, [clientesQuery.data, debouncedSearch, filters])

	const paginatedClientes = useMemo(() => {
		const start = (currentPage - 1) * pageSize
		const end = start + pageSize
		return filteredClientes.slice(start, end)
	}, [filteredClientes, currentPage, pageSize])

	const totalPages = Math.ceil(filteredClientes.length / pageSize)

	const filterChips = useMemo(() => {
		const chips: { key: "orden"; label: string }[] = []
		if (filters.orden !== defaultFilters.orden) {
			const label =
				filters.orden === "name_asc"
					? "Nombre A-Z"
					: filters.orden === "name_desc"
						? "Nombre Z-A"
						: filters.orden === "date_asc"
							? "Fecha ↑"
							: "Fecha ↓"
			chips.push({ key: "orden", label })
		}
		return chips
	}, [filters])

	const handleCreate = useCallback(
		(values: ClienteFormValues) => {
			const payload: ClientePayload = {
				nombres: values.nombres,
				apellidos: values.apellidos,
				cedula: values.cedula,
				correo: values.correo || null,
				telefono: values.telefono || null,
				direccion: values.direccion || null,
			}
			createMutation.mutate(payload)
		},
		[createMutation]
	)

	const handleEdit = useCallback(
		(values: ClienteFormValues) => {
			if (!editingCliente) return
			const payload: ClientePayload = {
				nombres: values.nombres,
				apellidos: values.apellidos,
				cedula: values.cedula,
				correo: values.correo || null,
				telefono: values.telefono || null,
				direccion: values.direccion || null,
			}
			updateMutation.mutate({ id: editingCliente.id_cliente, payload })
		},
		[editingCliente, updateMutation]
	)

	const handleDelete = useCallback(
		(cliente: ClienteRecord) => {
			if (confirm(`¿Estás seguro de eliminar al cliente ${cliente.nombres} ${cliente.apellidos}?`)) {
				deleteMutation.mutate(cliente.id_cliente)
			}
		},
		[deleteMutation]
	)

	const handleOpenDetail = useCallback((cliente: ClienteRecord) => {
		setSelectedCliente(cliente)
		setDetailDrawerOpen(true)
	}, [])

	const handleOpenEdit = useCallback((cliente: ClienteRecord) => {
		setEditingCliente(cliente)
		editForm.reset({
			nombres: cliente.nombres,
			apellidos: cliente.apellidos,
			cedula: cliente.cedula,
			correo: cliente.correo || "",
			telefono: cliente.telefono || "",
			direccion: cliente.direccion || "",
		})
		setEditDialogOpen(true)
	}, [editForm])

	const getSourceForExport = async (scope: "page" | "filtered" | "all") => {
		if (scope === "page") return paginatedClientes
		if (scope === "filtered") return filteredClientes
		// all
		if (clientesQuery.data) return clientes
		const fetched = await queryClient.fetchQuery({
			queryKey: ["clientes"],
			queryFn: async () => {
				const { data } = await api.get<ClienteRecord[]>("/cliente")
				return Array.isArray(data) ? data : []
			}
		})
		return fetched ?? []
	}

	const buildExportRows = (records: ClienteRecord[]): ExportRow[] => {
		return records.map((cliente) => ({
			"ID Cliente": cliente.id_cliente.toString(),
			"Nombre": `${cliente.nombres} ${cliente.apellidos}`,
			"Cédula/RUC": cliente.cedula,
			"Correo": cliente.correo || "",
			"Teléfono": cliente.telefono || "",
			"Dirección": cliente.direccion || "",
			"Fecha Registro": dateFormatter.format(new Date(cliente.fecha_registro)),
		}))
	}

	const runExport = async (): Promise<boolean> => {
		setExportError(null)
		setExportStatus("exporting")
		try {
			const source = await getSourceForExport(exportScope)
			const rows = buildExportRows(source)
			if (rows.length === 0) {
				setExportError("No hay clientes para exportar")
				setExportStatus("idle")
				return false
			}
			const filenameBase = `clientes_${exportScope}_${new Date().toISOString().split('T')[0]}`
			switch (exportFormat) {
				case "csv":
					exportToCSV(rows, filenameBase)
					break
				case "xlsx":
					exportToXLSX(rows, filenameBase)
					break
				case "pdf":
					exportToPDF(rows, filenameBase)
					break
			}
			setExportStatus("done")
			return true
		} catch (error) {
			setExportError("No se pudo exportar")
			setExportStatus("idle")
			return false
		}
	}

	const startItem = (currentPage - 1) * pageSize + 1
	const endItem = Math.min(currentPage * pageSize, filteredClientes.length)

	return (
		<div className="space-y-8">
			<header className="flex flex-wrap items-center justify-between gap-3">
				<div>
					<p className="text-xs uppercase tracking-wide text-slate-500">Gestión</p>
					<h1 className="text-3xl font-semibold text-slate-900">Clientes</h1>
					<p className="mt-1 text-sm text-slate-500">Administra la información de tus clientes.</p>
				</div>
			</header>

			<section className="grid grid-cols-1 gap-4 md:grid-cols-3">
				<article className="rounded-2xl border border-slate-200 bg-white p-5">
					<p className="text-xs uppercase text-slate-500">Clientes registrados</p>
					<p className="mt-2 text-3xl font-semibold text-slate-900">{filteredClientes.length}</p>
					<p className="text-sm text-slate-500">Total en el sistema</p>
				</article>
				<article className="rounded-2xl border border-slate-200 bg-white p-5">
					<p className="text-xs uppercase text-slate-500">Clientes activos</p>
					<p className="mt-2 text-3xl font-semibold text-blue-600">{filteredClientes.length}</p>
					<p className="text-sm text-slate-500">Disponibles para ventas</p>
				</article>
				<article className="rounded-2xl border border-slate-200 bg-white p-5">
					<p className="text-xs uppercase text-slate-500">Nuevos este mes</p>
					<p className="mt-2 text-3xl font-semibold text-purple-600">
						{filteredClientes.filter(c => {
							const regDate = new Date(c.fecha_registro)
							const now = new Date()
							return regDate.getMonth() === now.getMonth() && regDate.getFullYear() === now.getFullYear()
						}).length}
					</p>
					<p className="text-sm text-slate-500">Registrados recientemente</p>
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

			<section aria-labelledby="clientes-listado" className="rounded-2xl border border-slate-200 bg-white">
				<ClientesListHeader
					startItem={startItem}
					endItem={endItem}
					resultsCount={filteredClientes.length}
					searchInput={searchInput}
					onSearchInputChange={setSearchInput}
					onOpenFilters={() => setFiltersDrawerOpen(true)}
					viewMode={viewMode}
					onChangeViewMode={setViewMode}
					pageSize={pageSize}
					onChangePageSize={(next) => {
						setPageSize(next as PageSizeOption)
						setCurrentPage(1)
					}}
					onOpenCreate={() => setCreateDialogOpen(true)}
					onOpenExport={() => setExportDialogOpen(true)}
					filterChips={filterChips}
					onRemoveChip={(key) => {
						if (key === "orden") {
							setFilters((prev) => ({ ...prev, orden: defaultFilters.orden }))
						}
					}}
					onClearAllFilters={() => setFilters(defaultFilters)}
				/>

				{viewMode === "table" ? (
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-slate-200">
							<thead className="bg-slate-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
										Cliente
									</th>
									<th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
										Contacto
									</th>
									<th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
										Fecha Registro
									</th>
									<th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
										Acciones
									</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-slate-200 bg-white">
								{paginatedClientes.map((cliente) => (
									<tr key={cliente.id_cliente} className="hover:bg-slate-50">
										<td className="px-6 py-4">
											<div className="flex items-center gap-3">
												<div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
													<Users className="h-5 w-5 text-slate-600" />
												</div>
												<div>
													<p className="font-medium text-slate-900">
														{cliente.nombres} {cliente.apellidos}
													</p>
													<p className="text-sm text-slate-500">{cliente.cedula}</p>
												</div>
											</div>
										</td>
										<td className="px-6 py-4">
											<div className="space-y-1">
												{cliente.correo && (
													<div className="flex items-center gap-2 text-sm text-slate-600">
														<Mail className="h-4 w-4" />
														{cliente.correo}
													</div>
												)}
												{cliente.telefono && (
													<div className="flex items-center gap-2 text-sm text-slate-600">
														<Phone className="h-4 w-4" />
														{cliente.telefono}
													</div>
												)}
												{cliente.direccion && (
													<div className="flex items-center gap-2 text-sm text-slate-600">
														<MapPin className="h-4 w-4" />
														{cliente.direccion}
													</div>
												)}
											</div>
										</td>
										<td className="px-6 py-4 text-sm text-slate-600">
											{dateFormatter.format(new Date(cliente.fecha_registro))}
										</td>
										<td className="px-6 py-4 text-right">
											<div className="flex items-center justify-end gap-2">
												<button
													onClick={() => handleOpenDetail(cliente)}
													className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-medium shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
												>
													<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
													</svg>
												</button>
												<button
													onClick={() => handleOpenEdit(cliente)}
													className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-medium shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-950"
												>
													<Edit2 className="h-4 w-4" />
												</button>
												<button
													onClick={() => handleDelete(cliente)}
													className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 bg-white text-sm font-medium text-red-600 shadow-sm transition-colors hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-red-950"
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
				) : (
					<div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2 lg:grid-cols-3">
						{paginatedClientes.map((cliente) => (
							<div key={cliente.id_cliente} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition">
								<div className="flex items-start justify-between">
									<div>
										<p className="font-semibold text-slate-900">{cliente.nombres} {cliente.apellidos}</p>
										<p className="text-sm text-slate-500">{cliente.cedula}</p>
									</div>
									<button
										onClick={() => handleOpenDetail(cliente)}
										className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:border-slate-300 hover:text-slate-900"
									>
										<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
										</svg>
									</button>
								</div>
								<div className="mt-3 space-y-2">
									{cliente.correo && (
										<p className="text-sm text-slate-700">
											<span className="font-medium">Correo:</span> {cliente.correo}
										</p>
									)}
									{cliente.telefono && (
										<p className="text-sm text-slate-700">
											<span className="font-medium">Teléfono:</span> {cliente.telefono}
										</p>
									)}
									<p className="text-sm text-slate-700">
										<span className="font-medium">Registro:</span> {dateFormatter.format(new Date(cliente.fecha_registro))}
									</p>
								</div>
							</div>
						))}
					</div>
				)}

				{/* Estados de carga y vacío */}
				{clientesQuery.isLoading && (
					<div className="flex items-center justify-center gap-2 p-6 text-slate-500">
						<Loader2 className="h-4 w-4 animate-spin" />
						Cargando clientes...
					</div>
				)}

				{!clientesQuery.isLoading && paginatedClientes.length === 0 && filteredClientes.length === 0 && (
					<div className="p-8 text-center text-slate-500">
						<Users size={36} className="mx-auto mb-2 opacity-50" />
						<p>No hay clientes registrados.</p>
					</div>
				)}

				{!clientesQuery.isLoading && paginatedClientes.length === 0 && filteredClientes.length > 0 && (
					<div className="p-8 text-center text-slate-500">
						<Users size={36} className="mx-auto mb-2 opacity-50" />
						<p>No se encontraron clientes con los filtros aplicados.</p>
					</div>
				)}

				{/* Paginación */}
				{totalPages > 1 && (
					<div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-3">
						<div className="flex items-center gap-2">
							<button
								onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
								disabled={currentPage === 1}
								className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Anterior
							</button>
							<span className="text-sm text-slate-600">
								Página {currentPage} de {totalPages}
							</span>
							<button
								onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
								disabled={currentPage === totalPages}
								className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
							>
								Siguiente
							</button>
						</div>
					</div>
				)}
			</section>

			{/* Drawers y Dialogs */}
			<ClientesFiltersDrawer
				open={filtersDrawerOpen}
				onOpenChange={setFiltersDrawerOpen}
				filters={filters}
				onFiltersChange={setFilters}
			/>

			<ClientesDetailDrawer
				open={detailDrawerOpen}
				onOpenChange={setDetailDrawerOpen}
				cliente={selectedCliente}
				dateFormatter={dateFormatter}
				onEdit={() => {
					if (selectedCliente) {
						handleOpenEdit(selectedCliente)
						setDetailDrawerOpen(false)
					}
				}}
				onClose={() => setDetailDrawerOpen(false)}
			/>

			{/* Create Dialog */}
			{createDialogOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setCreateDialogOpen(false)}>
					<div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8" onClick={(e) => e.stopPropagation()}>
						<div className="mb-6">
							<h2 className="text-xl font-semibold text-slate-900">Registrar cliente</h2>
							<p className="text-sm text-slate-600">Agrega un nuevo cliente al sistema.</p>
						</div>

						{createMutation.isError && (
							<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
								{getApiErrorMessage(createMutation.error, "No se pudo registrar el cliente")}
							</div>
						)}

						<form onSubmit={form.handleSubmit(handleCreate)} className="space-y-6">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
										Nombres
									</label>
									<input
										{...form.register("nombres")}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
									/>
									{form.formState.errors.nombres && (
										<p className="mt-1 text-xs text-red-600">{form.formState.errors.nombres.message}</p>
									)}
								</div>
								<div>
									<label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
										Apellidos
									</label>
									<input
										{...form.register("apellidos")}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
									/>
									{form.formState.errors.apellidos && (
										<p className="mt-1 text-xs text-red-600">{form.formState.errors.apellidos.message}</p>
									)}
								</div>
							</div>
							<div>
								<label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
									Cédula
								</label>
								<input
									{...form.register("cedula")}
									className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
								/>
								{form.formState.errors.cedula && (
									<p className="mt-1 text-xs text-red-600">{form.formState.errors.cedula.message}</p>
								)}
							</div>
							<div>
								<label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
									Correo
								</label>
								<input
									{...form.register("correo")}
									type="email"
									className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
								/>
								{form.formState.errors.correo && (
									<p className="mt-1 text-xs text-red-600">{form.formState.errors.correo.message}</p>
								)}
							</div>
							<div>
								<label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
									Teléfono
								</label>
								<input
									{...form.register("telefono")}
									className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
								/>
								{form.formState.errors.telefono && (
									<p className="mt-1 text-xs text-red-600">{form.formState.errors.telefono.message}</p>
								)}
							</div>
							<div>
								<label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
									Dirección
								</label>
								<textarea
									{...form.register("direccion")}
									rows={3}
									className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
								/>
								{form.formState.errors.direccion && (
									<p className="mt-1 text-xs text-red-600">{form.formState.errors.direccion.message}</p>
								)}
							</div>

							<div className="flex justify-end gap-3">
								<button
									type="button"
									onClick={() => setCreateDialogOpen(false)}
									className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={createMutation.isPending}
									className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
								>
									{createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
									Crear Cliente
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Edit Dialog */}
			{editDialogOpen && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEditDialogOpen(false)}>
					<div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-8" onClick={(e) => e.stopPropagation()}>
						<div className="mb-6">
							<h2 className="text-xl font-semibold text-slate-900">Editar cliente</h2>
							<p className="text-sm text-slate-600">Modifica la información del cliente.</p>
						</div>

						{updateMutation.isError && (
							<div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-4">
								{getApiErrorMessage(updateMutation.error, "No se pudo actualizar el cliente")}
							</div>
						)}

						<form onSubmit={editForm.handleSubmit(handleEdit)} className="space-y-6">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
										Nombres
									</label>
									<input
										{...editForm.register("nombres")}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
									/>
									{editForm.formState.errors.nombres && (
										<p className="mt-1 text-xs text-red-600">{editForm.formState.errors.nombres.message}</p>
									)}
								</div>
								<div>
									<label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
										Apellidos
									</label>
									<input
										{...editForm.register("apellidos")}
										className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
									/>
									{editForm.formState.errors.apellidos && (
										<p className="mt-1 text-xs text-red-600">{editForm.formState.errors.apellidos.message}</p>
									)}
								</div>
							</div>
							<div>
								<label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
									Cédula
								</label>
								<input
									{...editForm.register("cedula")}
									className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
								/>
								{editForm.formState.errors.cedula && (
									<p className="mt-1 text-xs text-red-600">{editForm.formState.errors.cedula.message}</p>
								)}
							</div>
							<div>
								<label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
									Correo
								</label>
								<input
									{...editForm.register("correo")}
									type="email"
									className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
								/>
								{editForm.formState.errors.correo && (
									<p className="mt-1 text-xs text-red-600">{editForm.formState.errors.correo.message}</p>
								)}
							</div>
							<div>
								<label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
									Teléfono
								</label>
								<input
									{...editForm.register("telefono")}
									className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
								/>
								{editForm.formState.errors.telefono && (
									<p className="mt-1 text-xs text-red-600">{editForm.formState.errors.telefono.message}</p>
								)}
							</div>
							<div>
								<label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
									Dirección
								</label>
								<textarea
									{...editForm.register("direccion")}
									rows={3}
									className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
								/>
								{editForm.formState.errors.direccion && (
									<p className="mt-1 text-xs text-red-600">{editForm.formState.errors.direccion.message}</p>
								)}
							</div>

							<div className="flex justify-end gap-3">
								<button
									type="button"
									onClick={() => setEditDialogOpen(false)}
									className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
								>
									Cancelar
								</button>
								<button
									type="submit"
									disabled={updateMutation.isPending}
									className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-50"
								>
									{updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
									Guardar Cambios
								</button>
							</div>
						</form>
					</div>
				</div>
			)}

			{/* Export Dialog */}
			<Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
				<DialogContent className="max-w-3xl" disableOutsideClose hideCloseButton>
					<DialogHeader>
						<DialogTitle>Exportar clientes</DialogTitle>
						<DialogDescription>Selecciona el alcance y el formato de exportación.</DialogDescription>
					</DialogHeader>

					<div className="grid gap-6 md:grid-cols-2">
						<div className="grid gap-3">
							<p className="text-sm font-semibold text-slate-900">Alcance</p>
							<div className="grid gap-2">
								<label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 hover:bg-slate-50">
									<input
										type="radio"
										name="export-scope"
										checked={exportScope === "page"}
										onChange={() => setExportScope("page")}
										className="mt-1"
									/>
									<div>
										<p className="text-sm font-semibold text-slate-900">Página actual</p>
										<p className="text-xs text-slate-500">Lo visible en pantalla según la paginación actual.</p>
									</div>
								</label>
								<label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 hover:bg-slate-50">
									<input
										type="radio"
										name="export-scope"
										checked={exportScope === "filtered"}
										onChange={() => setExportScope("filtered")}
										className="mt-1"
									/>
									<div>
										<p className="text-sm font-semibold text-slate-900">Filtradas</p>
										<p className="text-xs text-slate-500">Aplica búsqueda + filtros + orden, sin importar página.</p>
									</div>
								</label>
								<label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 hover:bg-slate-50">
									<input
										type="radio"
										name="export-scope"
										checked={exportScope === "all"}
										onChange={() => setExportScope("all")}
										className="mt-1"
									/>
									<div>
										<p className="text-sm font-semibold text-slate-900">Todo</p>
										<p className="text-xs text-slate-500">Ignora filtros y exporta todos los clientes.</p>
									</div>
								</label>
							</div>
						</div>

						<div className="grid gap-3">
							<p className="text-sm font-semibold text-slate-900">Formato</p>
							<div className="grid gap-2">
								<label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 hover:bg-slate-50">
									<input
										type="radio"
										name="export-format"
										checked={exportFormat === "csv"}
										onChange={() => setExportFormat("csv")}
										className="mt-1"
									/>
									<div>
										<p className="text-sm font-semibold text-slate-900">CSV</p>
										<p className="text-xs text-slate-500">Compatible con Excel (separador ;).</p>
									</div>
								</label>
								<label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 hover:bg-slate-50">
									<input
										type="radio"
										name="export-format"
										checked={exportFormat === "xlsx"}
										onChange={() => setExportFormat("xlsx")}
										className="mt-1"
									/>
									<div>
										<p className="text-sm font-semibold text-slate-900">Excel (.xlsx)</p>
										<p className="text-xs text-slate-500">Hoja "Clientes" con columnas formateadas.</p>
									</div>
								</label>
								<label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-slate-900 hover:bg-slate-50">
									<input
										type="radio"
										name="export-format"
										checked={exportFormat === "pdf"}
										onChange={() => setExportFormat("pdf")}
										className="mt-1"
									/>
									<div>
										<p className="text-sm font-semibold text-slate-900">PDF</p>
										<p className="text-xs text-slate-500">Tabla en PDF (landscape).</p>
									</div>
								</label>
							</div>
						</div>
					</div>

					{exportError && (
						<div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{exportError}</div>
					)}

					<DialogFooter>
						<button
							type="button"
							onClick={() => {
								if (exportStatus === "exporting") return
								setExportDialogOpen(false)
							}}
							disabled={exportStatus === "exporting"}
							className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
						>
							Cancelar
						</button>
						<button
							type="button"
							onClick={async () => {
								const ok = await runExport()
								if (ok) setExportDialogOpen(false)
							}}
							disabled={exportStatus === "exporting"}
							className="inline-flex items-center justify-center rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
						>
							{exportStatus === "exporting" ? "Exportando…" : exportStatus === "done" ? "Listo" : "Aceptar"}
						</button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	)
}
