"use client"

import { useEffect, useState } from "react"
import { api } from "../../lib/apiClient"
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"

interface Venta {
  id_venta?: number
  id_cliente?: number
  total?: number
  fecha?: string
  estado?: string
  descripcion?: string
}

export default function VentasPage() {
  const [ventas, setVentas] = useState<Venta[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const { register, handleSubmit, reset } = useForm<Venta>()

  useEffect(() => {
    fetchVentas()
  }, [])

  const fetchVentas = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get("/ventas")
      setVentas(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error(err)
      setError("No se pudo cargar la lista de ventas.")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: Venta) => {
    try {
      if (editingId) {
        await api.put(`/ventas/${editingId}`, data)
      } else {
        await api.post("/ventas", data)
      }
      reset()
      setShowForm(false)
      setEditingId(null)
      fetchVentas()
    } catch (err) {
      console.error(err)
      alert("Error al guardar venta")
    }
  }

  const handleEdit = (venta: Venta) => {
    setEditingId(venta.id_venta || null)
    reset(venta)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("¿Seguro que deseas eliminar esta venta?")) {
      try {
        await api.delete(`/ventas/${id}`)
        fetchVentas()
      } catch (err) {
        console.error(err)
        alert("Error al eliminar venta")
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ventas (POS)</h1>
          <p className="text-slate-600 mt-1">Gestiona todas las transacciones de venta.</p>
        </div>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setEditingId(null)
            reset()
          }}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition font-medium"
        >
          <Plus size={20} />
          Nueva venta
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">{editingId ? "Editar venta" : "Nueva venta"}</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="ID Cliente"
              {...register("id_cliente", { required: true })}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="number"
              placeholder="Total"
              step="0.01"
              {...register("total", { required: true })}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="date"
              {...register("fecha")}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="text"
              placeholder="Estado"
              {...register("estado")}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <textarea
              placeholder="Descripción"
              {...register("descripcion")}
              className="md:col-span-2 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-emerald-600 text-white py-2 rounded-lg font-medium hover:bg-emerald-700 transition"
              >
                Guardar venta
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  reset()
                }}
                className="flex-1 bg-slate-200 text-slate-900 py-2 rounded-lg font-medium hover:bg-slate-300 transition"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {loading && <p className="text-slate-600">Cargando ventas...</p>}
      {error && (
        <div className="text-red-600 bg-red-50 p-3 rounded-lg mb-4 flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">ID</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Cliente</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Total</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Fecha</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Estado</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {ventas.map((v) => (
              <tr key={v.id_venta} className="hover:bg-slate-50 transition">
                <td className="px-6 py-3 text-sm text-slate-700">{v.id_venta}</td>
                <td className="px-6 py-3 text-sm text-slate-700">{v.id_cliente}</td>
                <td className="px-6 py-3 text-sm text-slate-900 font-medium">${v.total?.toFixed(2)}</td>
                <td className="px-6 py-3 text-sm text-slate-700">{v.fecha}</td>
                <td className="px-6 py-3 text-sm">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">{v.estado}</span>
                </td>
                <td className="px-6 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(v)}
                      className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(v.id_venta!)}
                      className="p-1.5 hover:bg-red-100 rounded text-red-600 transition"
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
