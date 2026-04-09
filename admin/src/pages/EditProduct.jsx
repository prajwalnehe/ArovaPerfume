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
    brand: '',
    category: '',
    subcategory: '',
    salePrice: '',
    mrp: '',
    stock: '',
    description: '',
    topNotes: '',
    middleNotes: '',
    baseNotes: '',
    image1: '',
    image2: '',
    image3: '',
    image4: '',
    payOnDelivery: false,
    freeDelivery: false,
    isReturnable: true,
    tags: [],
  })

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        const res = await productsAPI.getById(id)
        const p = res?.data
        if (!p) return
        setForm({
          title: p.title || '',
          brand: p.brand || '',
          category: p.category || '',
          subcategory: p.subcategory || '',
          salePrice: p.pricing?.salePrice || p.salePrice || '',
          mrp: p.pricing?.mrp || p.mrp || '',
          stock: p.stock?.quantity || p.stock || '',
          description: p.description || '',
          topNotes: Array.isArray(p.notes?.topNotes) ? p.notes.topNotes.join(', ') : (p.topNotes || ''),
          middleNotes: Array.isArray(p.notes?.middleNotes) ? p.notes.middleNotes.join(', ') : (p.middleNotes || ''),
          baseNotes: Array.isArray(p.notes?.baseNotes) ? p.notes.baseNotes.join(', ') : (p.baseNotes || ''),
          image1: p.images?.[0] || p.images?.image1 || p.image || '',
          image2: p.images?.[1] || p.images?.image2 || '',
          image3: p.images?.[2] || p.images?.image3 || '',
          image4: p.images?.[3] || p.images?.image4 || '',
          payOnDelivery: p.services?.payOnDelivery || false,
          freeDelivery: p.services?.freeDelivery || false,
          isReturnable: p.shippingAndReturns?.returns?.isReturnable ?? true,
          tags: p.tags || [],
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
        brand: form.brand,
        category: form.category,
        subcategory: form.subcategory,
        pricing: {
          salePrice: Number(form.salePrice) || 0,
          mrp: Number(form.mrp) || 0,
        },
        stock: {
          quantity: Number(form.stock) || 0,
        },
        notes: {
          topNotes: form.topNotes ? form.topNotes.split(',').map(n => n.trim()).filter(Boolean) : [],
          middleNotes: form.middleNotes ? form.middleNotes.split(',').map(n => n.trim()).filter(Boolean) : [],
          baseNotes: form.baseNotes ? form.baseNotes.split(',').map(n => n.trim()).filter(Boolean) : [],
        },
        description: form.description,
        images: [
          form.image1,
          form.image2,
          form.image3,
          form.image4
        ].filter(img => img && img.trim() !== ''),
        services: {
          payOnDelivery: form.payOnDelivery,
          freeDelivery: form.freeDelivery,
        },
        shippingAndReturns: {
          returns: {
            isReturnable: form.isReturnable,
          },
        },
        tags: form.tags,
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
      <form className="space-y-6" onSubmit={handleSubmit}>
        
        {/* Basic Information */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded-lg px-3 py-2" name="title" placeholder="Product Title" value={form.title} onChange={onChange} />
            <input className="border rounded-lg px-3 py-2" name="brand" placeholder="Brand Name" value={form.brand} onChange={onChange} />
            <input className="border rounded-lg px-3 py-2" name="category" placeholder="Category" value={form.category} onChange={onChange} />
            <input className="border rounded-lg px-3 py-2" name="subcategory" placeholder="Subcategory" value={form.subcategory} onChange={onChange} />
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Pricing</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded-lg px-3 py-2" name="mrp" placeholder="MRP" type="number" value={form.mrp} onChange={onChange} />
            <input className="border rounded-lg px-3 py-2" name="salePrice" placeholder="Sale Price" type="number" value={form.salePrice} onChange={onChange} />
          </div>
        </div>

        {/* Stock */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Stock</h4>
          <input className="border rounded-lg px-3 py-2 w-full md:w-1/2" name="stock" placeholder="Stock Quantity" type="number" value={form.stock} onChange={onChange} />
        </div>

        {/* Notes */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Notes</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input className="border rounded-lg px-3 py-2" name="topNotes" placeholder="Top Notes (comma separated)" value={form.topNotes} onChange={onChange} />
            <input className="border rounded-lg px-3 py-2" name="middleNotes" placeholder="Middle Notes (comma separated)" value={form.middleNotes} onChange={onChange} />
            <input className="border rounded-lg px-3 py-2" name="baseNotes" placeholder="Base Notes (comma separated)" value={form.baseNotes} onChange={onChange} />
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Description</h4>
          <textarea className="border rounded-lg px-3 py-2 w-full" rows="4" name="description" placeholder="Product description" value={form.description} onChange={onChange} />
        </div>

        {/* Images */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Image URLs</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded-lg px-3 py-2" name="image1" placeholder="Primary Image URL" value={form.image1} onChange={onChange} />
            <input className="border rounded-lg px-3 py-2" name="image2" placeholder="Image 2 URL" value={form.image2} onChange={onChange} />
            <input className="border rounded-lg px-3 py-2" name="image3" placeholder="Image 3 URL" value={form.image3} onChange={onChange} />
            <input className="border rounded-lg px-3 py-2" name="image4" placeholder="Image 4 URL" value={form.image4} onChange={onChange} />
          </div>
        </div>

        {/* Tags */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Product Tags</h4>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={form.tags.includes('Best Seller')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setForm(prev => ({...prev, tags: [...prev.tags, 'Best Seller']}));
                  } else {
                    setForm(prev => ({...prev, tags: prev.tags.filter(t => t !== 'Best Seller')}));
                  }
                }}
              />
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">Best Seller</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={form.tags.includes('Only Few Left Hurry')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setForm(prev => ({...prev, tags: [...prev.tags, 'Only Few Left Hurry']}));
                  } else {
                    setForm(prev => ({...prev, tags: prev.tags.filter(t => t !== 'Only Few Left Hurry')}));
                  }
                }}
              />
              <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">Only Few Left Hurry</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={form.tags.includes('Highly Recommended')}
                onChange={(e) => {
                  if (e.target.checked) {
                    setForm(prev => ({...prev, tags: [...prev.tags, 'Highly Recommended']}));
                  } else {
                    setForm(prev => ({...prev, tags: prev.tags.filter(t => t !== 'Highly Recommended')}));
                  }
                }}
              />
              <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm font-medium">Highly Recommended</span>
            </label>
          </div>
        </div>

        {/* Services */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Services</h4>
          <div className="flex gap-6">
            <label className="flex items-center space-x-2">
              <input type="checkbox" name="payOnDelivery" checked={form.payOnDelivery} onChange={(e) => setForm(prev => ({...prev, payOnDelivery: e.target.checked}))} />
              <span>Pay on Delivery</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" name="freeDelivery" checked={form.freeDelivery} onChange={(e) => setForm(prev => ({...prev, freeDelivery: e.target.checked}))} />
              <span>Free Delivery</span>
            </label>
          </div>
        </div>

        {/* Returns */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Returns</h4>
          <label className="flex items-center space-x-2">
            <input type="checkbox" name="isReturnable" checked={form.isReturnable} onChange={(e) => setForm(prev => ({...prev, isReturnable: e.target.checked}))} />
            <span>Product is Returnable</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button
            disabled={saving}
            type="submit"
            className="rounded-lg bg-slate-900 text-white px-6 py-2.5 hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? 'Updating...' : 'Update Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="rounded-lg border border-slate-300 px-6 py-2.5 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default EditProduct

