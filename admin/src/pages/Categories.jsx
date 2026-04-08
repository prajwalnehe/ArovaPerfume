import { useEffect, useState } from 'react'
import { categoriesAPI } from '../services/api'

const Categories = () => {
  const [categories, setCategories] = useState([])
  const [newCategory, setNewCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const res = await categoriesAPI.getAll()
      const data = res?.data?.data || []
      setCategories(Array.isArray(data) ? data : [])
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load categories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!newCategory.trim()) return
    try {
      await categoriesAPI.add({ name: newCategory.trim() })
      setMessage('Category added successfully.')
      setNewCategory('')
      fetchCategories()
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add category')
    }
  }

  const handleDelete = async (id) => {
    const ok = window.confirm('Delete this category?')
    if (!ok) return
    try {
      await categoriesAPI.remove(id)
      setMessage('Category deleted successfully.')
      setCategories((prev) => prev.filter((c) => (c._id || c.id) !== id))
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to delete category')
    }
  }

  return (
    <div className="space-y-4">
      {message && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">{message}</div>
      )}

      <form onSubmit={handleAdd} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex gap-3">
        <input
          className="flex-1 border rounded-lg px-3 py-2"
          placeholder="Category name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <button className="rounded-lg bg-slate-900 text-white px-4 py-2 hover:bg-slate-800">
          Add
        </button>
      </form>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-4 text-sm text-slate-500">Loading categories...</div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {categories.map((cat) => {
              const id = cat._id || cat.id
              const label = cat.name || cat.title || cat.category || '-'
              return (
                <li key={id} className="flex items-center justify-between p-4">
                  <span className="text-slate-800">{label}</span>
                  <button
                    onClick={() => handleDelete(id)}
                    className="rounded-md border border-rose-300 text-rose-600 px-3 py-1.5 hover:bg-rose-50"
                  >
                    Delete
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

export default Categories

