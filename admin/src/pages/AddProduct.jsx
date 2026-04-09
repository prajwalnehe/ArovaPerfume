import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { productsAPI } from '../services/api'

const AddProduct = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
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

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setLoading(true)
    try {
      const payload = {
        title: form.title,
        brand: form.brand,
        category: form.category,
        subcategory: form.subcategory,
        pricing: {
          salePrice: Number(form.salePrice),
          mrp: Number(form.mrp),
        },
        stock: {
          quantity: Number(form.stock) || 0,
        },
        notes: {
          topNotes: form.topNotes ? form.topNotes.split(',').map(n => n.trim()) : [],
          middleNotes: form.middleNotes ? form.middleNotes.split(',').map(n => n.trim()) : [],
          baseNotes: form.baseNotes ? form.baseNotes.split(',').map(n => n.trim()) : [],
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
      await productsAPI.add(payload)
      setMessage('Product added successfully.')
      setTimeout(() => navigate('/products'), 600)
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to add product')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-semibold mb-4">Add Product</h3>
      {message && (
        <div className="mb-4 rounded-lg border border-slate-200 p-3 text-sm">{message}</div>
      )}
      <form className="space-y-6" onSubmit={handleSubmit}>
        
        {/* Basic Information */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Basic Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded-lg px-3 py-2" name="title" placeholder="Product Title" onChange={onChange} value={form.title} />
            <input className="border rounded-lg px-3 py-2" name="brand" placeholder="Brand Name" onChange={onChange} value={form.brand} />
            <input className="border rounded-lg px-3 py-2" name="category" placeholder="Category" onChange={onChange} value={form.category} />
            <input className="border rounded-lg px-3 py-2" name="subcategory" placeholder="Subcategory" onChange={onChange} value={form.subcategory} />
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Pricing</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded-lg px-3 py-2" name="mrp" placeholder="MRP" type="number" onChange={onChange} value={form.mrp} />
            <input className="border rounded-lg px-3 py-2" name="salePrice" placeholder="Sale Price" type="number" onChange={onChange} value={form.salePrice} />
          </div>
        </div>

        {/* Stock */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Stock</h4>
          <input className="border rounded-lg px-3 py-2 w-full md:w-1/2" name="stock" placeholder="Stock Quantity" type="number" onChange={onChange} value={form.stock} />
        </div>

        {/* Notes (for perfumes) */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Notes</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input className="border rounded-lg px-3 py-2" name="topNotes" placeholder="Top Notes (comma separated)" onChange={onChange} value={form.topNotes} />
            <input className="border rounded-lg px-3 py-2" name="middleNotes" placeholder="Middle Notes (comma separated)" onChange={onChange} value={form.middleNotes} />
            <input className="border rounded-lg px-3 py-2" name="baseNotes" placeholder="Base Notes (comma separated)" onChange={onChange} value={form.baseNotes} />
          </div>
        </div>

        {/* Description */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Description</h4>
          <textarea className="border rounded-lg px-3 py-2 w-full" rows="4" name="description" placeholder="Product description" onChange={onChange} value={form.description} />
        </div>

        {/* Images */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Image URLs</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded-lg px-3 py-2" name="image1" placeholder="Primary Image URL" onChange={onChange} value={form.image1} />
            <input className="border rounded-lg px-3 py-2" name="image2" placeholder="Image 2 URL" onChange={onChange} value={form.image2} />
            <input className="border rounded-lg px-3 py-2" name="image3" placeholder="Image 3 URL" onChange={onChange} value={form.image3} />
            <input className="border rounded-lg px-3 py-2" name="image4" placeholder="Image 4 URL" onChange={onChange} value={form.image4} />
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

        {/* Shipping & Returns */}
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
            disabled={loading}
            type="submit"
            className="rounded-lg bg-slate-900 text-white px-6 py-2.5 hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save Product'}
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

export default AddProduct

