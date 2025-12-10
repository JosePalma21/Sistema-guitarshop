"use client"

import { useEffect, useState } from "react"
import { api } from "../../lib/apiClient"
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"

interface Cliente {
  id_cliente?: number
  nombre?: string
  email?: string
  telefono?: string
  direccion?: string
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const { register, handleSubmit, reset } = useForm<Cliente>()

  useEffect(() => {
    fetchClientes()
  }, [])

  const fetchClientes = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get("/cliente")
      setClientes(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error(err)
      setError("No se pudo cargar la lista de clientes.")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: Cliente) => {
    try {
      if (editingId) {
        await api.put(`/cliente/${editingId}`, data)
      } else {
        await api.post("/cliente", data)
      }
      reset()
      setShowForm(false)
      setEditingId(null)
      fetchClientes()
    } catch (err) {
      console.error(err)
      alert("Error al guardar cliente")
    }
  }

  const handleEdit = (cliente: Cliente) => {
    setEditingId(cliente.id_cliente || null)
    reset(cliente)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("¿Seguro que deseas eliminar este cliente?")) {
      try {
        await api.delete(`/cliente/${id}`)
        fetchClientes()
      } catch (err) {
        console.error(err)
        alert("Error al eliminar cliente")
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clientes</h1>
          <p className="text-slate-600 mt-1">Gestiona los clientes de GuitarShop.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            reset()
          }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition"
        >
          <Plus size={20} />
          Nuevo cliente
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{editingId ? "Editar cliente" : "Nuevo cliente"}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <input
              type="text"
              placeholder="Nombre"
              {...register("nombre")}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="email"
              placeholder="Email"
              {...register("email")}
              required
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="tel"
              placeholder="Teléfono"
              {...register("telefono")}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="text"
              placeholder="Dirección"
              {...register("direccion")}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  reset()
                }}
                className="flex-1 bg-slate-200 text-slate-900 py-2 rounded-lg font-medium hover:bg-slate-300"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="text-slate-600">Cargando...</p>}
      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Nombre</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Teléfono</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Dirección</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {clientes.map((c) => (
              <tr key={c.id_cliente} className="hover:bg-slate-50">
                <td className="px-6 py-3 text-sm text-slate-700">{c.id_cliente}</td>
                <td className="px-6 py-3 text-sm text-slate-700">{c.nombre}</td>
                <td className="px-6 py-3 text-sm text-slate-700">{c.email}</td>
                <td className="px-6 py-3 text-sm text-slate-700">{c.telefono || "—"}</td>
                <td className="px-6 py-3 text-sm text-slate-700">{c.direccion || "—"}</td>
                <td className="px-6 py-3 text-sm">
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(c)} className="p-1 hover:bg-blue-100 rounded text-blue-600">
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(c.id_cliente!)}
                      className="p-1 hover:bg-red-100 rounded text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
