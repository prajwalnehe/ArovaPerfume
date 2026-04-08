import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { productsAPI } from '../services/api'

const EditProduct = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    title: '',
    category: '',
    mrp: '',
    discountPercent: '',
    description: '',
    image1: '',
    image2: '',
    image3: '',
  })

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const res = await productsAPI.getById(id)
        const p = res?.data?.data
        if (!p) return
        setForm({
          title: p.title || p.name || '',
          category: p.category || p.catagory || '',
          mrp: p.mrp || p.price || '',
          discountPercent: p.discountPercent || 0,
          description: p.description || '',
          image1: p.image || p.images?.image1 || '',
          image2: p.images?.image2 || '',
          image3: p.images?.image3 || '',
        })
      } catch (error) {
        setMessage(error.response?.data?.message || 'Failed to load product')
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [id])

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      const payload = {
        title: form.title,
        category: form.category,
        mrp: Number(form.mrp),
        discountPercent: Number(form.discountPercent || 0),
        description: form.description,
        images: {
          image1: form.image1,
          image2: form.image2 || undefined,
          image3: form.image3 || undefined,
        },
      }
      await productsAPI.update(id, payload)
      setMessage('Product updated successfully.')
      setTimeout(() => navigate('/products'), 600)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update product')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="text-sm text-slate-500">Loading product...</div>
  }

  return (
    <div className="max-w-3xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Edit Product</h3>
      {message && (
        <div className="mb-4 rounded-lg border border-slate-200 p-3 text-sm">{message}</div>
      )}
      <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
        <input className="border rounded-lg px-3 py-2" name="title" placeholder="Title" value={form.title} required onChange={onChange} />
        <input className="border rounded-lg px-3 py-2" name="category" placeholder="Category" value={form.category} required onChange={onChange} />
        <input className="border rounded-lg px-3 py-2" name="mrp" placeholder="MRP" type="number" value={form.mrp} required onChange={onChange} />
        <input className="border rounded-lg px-3 py-2" name="discountPercent" placeholder="Discount %" type="number" value={form.discountPercent} onChange={onChange} />
        <input className="border rounded-lg px-3 py-2 md:col-span-2" name="image1" placeholder="Primary image URL" value={form.image1} required onChange={onChange} />
        <input className="border rounded-lg px-3 py-2" name="image2" placeholder="Image 2 URL (optional)" value={form.image2} onChange={onChange} />
        <input className="border rounded-lg px-3 py-2" name="image3" placeholder="Image 3 URL (optional)" value={form.image3} onChange={onChange} />
        <textarea className="border rounded-lg px-3 py-2 md:col-span-2" rows="4" name="description" placeholder="Description" value={form.description} onChange={onChange} />

        <div className="md:col-span-2 flex gap-3">
          <button
            disabled={saving}
            type="submit"
            className="rounded-lg bg-slate-900 text-white px-5 py-2.5 hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? 'Updating...' : 'Update Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="rounded-lg border border-slate-300 px-5 py-2.5 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditProduct

