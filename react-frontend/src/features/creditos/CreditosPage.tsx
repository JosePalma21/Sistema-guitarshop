"use client"

import { useEffect, useState } from "react"
import { api } from "../../lib/apiClient"
import { Plus, Edit2, Trash2, AlertCircle } from "lucide-react"
import { useForm } from "react-hook-form"

interface Credito {
  id_credito?: number
  id_cliente?: number
  monto?: number
  fecha?: string
  estado?: string
  descripcion?: string
}

export default function CreditosPage() {
  const [creditos, setCreditos] = useState<Credito[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  const { register, handleSubmit, reset } = useForm<Credito>()

  useEffect(() => {
    fetchCreditos()
  }, [])

  const fetchCreditos = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get("/credito")
      setCreditos(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      console.error(err)
      setError("No se pudo cargar la lista de créditos.")
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: Credito) => {
    try {
      if (editingId) {
        await api.put(`/credito/${editingId}`, data)
      } else {
        await api.post("/credito", data)
      }
      reset()
      setShowForm(false)
      setEditingId(null)
      fetchCreditos()
    } catch (err) {
      console.error(err)
      alert("Error al guardar crédito")
    }
  }

  const handleEdit = (credito: Credito) => {
    setEditingId(credito.id_credito || null)
    reset(credito)
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (confirm("¿Seguro que deseas eliminar este crédito?")) {
      try {
        await api.delete(`/credito/${id}`)
        fetchCreditos()
      } catch (err) {
        console.error(err)
        alert("Error al eliminar crédito")
      }
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Créditos y Cuotas</h1>
          <p className="text-slate-600 mt-1">Gestiona los créditos y cuotas de los clientes.</p>
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
          Nuevo crédito
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-slate-900">
            {editingId ? "Editar crédito" : "Nuevo crédito"}
          </h2>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="number"
              placeholder="ID Cliente"
              {...register("id_cliente", { required: true })}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <input
              type="number"
              placeholder="Monto"
              step="0.01"
              {...register("monto", { required: true })}
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
                Guardar crédito
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

      {loading && <p className="text-slate-600">Cargando créditos...</p>}
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
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Monto</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Fecha</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Estado</th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {creditos.map((cr) => (
              <tr key={cr.id_credito} className="hover:bg-slate-50 transition">
                <td className="px-6 py-3 text-sm text-slate-700">{cr.id_credito}</td>
                <td className="px-6 py-3 text-sm text-slate-700">{cr.id_cliente}</td>
                <td className="px-6 py-3 text-sm text-slate-900 font-medium">${cr.monto?.toFixed(2)}</td>
                <td className="px-6 py-3 text-sm text-slate-700">{cr.fecha}</td>
                <td className="px-6 py-3 text-sm">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800">{cr.estado}</span>
                </td>
                <td className="px-6 py-3 text-sm">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(cr)}
                      className="p-1.5 hover:bg-blue-100 rounded text-blue-600 transition"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(cr.id_credito!)}
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
