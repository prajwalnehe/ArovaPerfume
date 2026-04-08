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
    gender: 'Unisex',
    category: '',
    subcategory: '',
    type: '',
    salePrice: '',
    mrp: '',
    stock: '',
    sku: '',
    description: '',
    topNotes: '',
    middleNotes: '',
    baseNotes: '',
    image1: '',
    image2: '',
    image3: '',
    image4: '',
    pincodeServiceable: true,
    secureTransaction: true,
    payOnDelivery: false,
    easyTracking: true,
    freeDelivery: false,
    isFreeShipping: true,
    shippingType: 'Standard',
    estimatedDelivery: '',
    isReturnable: true,
    returnPolicy: '',
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
        gender: form.gender,
        category: form.category,
        subcategory: form.subcategory,
        type: form.type,
        pricing: {
          salePrice: Number(form.salePrice),
          mrp: Number(form.mrp),
        },
        stock: {
          quantity: Number(form.stock) || 0,
          sku: form.sku,
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
        pincodeServiceable: form.pincodeServiceable,
        services: {
          secureTransaction: form.secureTransaction,
          payOnDelivery: form.payOnDelivery,
          easyTracking: form.easyTracking,
          freeDelivery: form.freeDelivery,
        },
        shippingAndReturns: {
          shipping: {
            isFreeShipping: form.isFreeShipping,
            shippingType: form.shippingType,
            estimatedDelivery: form.estimatedDelivery,
          },
          returns: {
            isReturnable: form.isReturnable,
            policy: form.returnPolicy,
          },
        },
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <input className="border rounded-lg px-3 py-2" name="title" placeholder="Product Title *" required onChange={onChange} value={form.title} />
            <input className="border rounded-lg px-3 py-2" name="brand" placeholder="Brand" onChange={onChange} value={form.brand} />
            <select className="border rounded-lg px-3 py-2" name="gender" onChange={onChange} value={form.gender}>
              <option value="Men">Men</option>
              <option value="Women">Women</option>
              <option value="Unisex">Unisex</option>
            </select>
            <input className="border rounded-lg px-3 py-2" name="category" placeholder="Category *" required onChange={onChange} value={form.category} />
            <input className="border rounded-lg px-3 py-2" name="subcategory" placeholder="Subcategory" onChange={onChange} value={form.subcategory} />
            <input className="border rounded-lg px-3 py-2" name="type" placeholder="Type" onChange={onChange} value={form.type} />
          </div>
        </div>

        {/* Pricing */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Pricing</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded-lg px-3 py-2" name="salePrice" placeholder="Sale Price *" type="number" required onChange={onChange} value={form.salePrice} />
            <input className="border rounded-lg px-3 py-2" name="mrp" placeholder="MRP *" type="number" required onChange={onChange} value={form.mrp} />
          </div>
        </div>

        {/* Stock */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Stock</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded-lg px-3 py-2" name="stock" placeholder="Stock Quantity" type="number" onChange={onChange} value={form.stock} />
            <input className="border rounded-lg px-3 py-2" name="sku" placeholder="SKU" onChange={onChange} value={form.sku} />
          </div>
        </div>

        {/* Notes (for perfumes) */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Notes (Perfume)</h4>
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
          <h4 className="font-medium text-slate-900 mb-3">Images</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input className="border rounded-lg px-3 py-2" name="image1" placeholder="Primary Image URL *" required onChange={onChange} value={form.image1} />
            <input className="border rounded-lg px-3 py-2" name="image2" placeholder="Image 2 URL" onChange={onChange} value={form.image2} />
            <input className="border rounded-lg px-3 py-2" name="image3" placeholder="Image 3 URL" onChange={onChange} value={form.image3} />
            <input className="border rounded-lg px-3 py-2" name="image4" placeholder="Image 4 URL" onChange={onChange} value={form.image4} />
          </div>
        </div>

        {/* Services */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Services</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <label className="flex items-center space-x-2">
              <input type="checkbox" name="secureTransaction" checked={form.secureTransaction} onChange={(e) => setForm(prev => ({...prev, secureTransaction: e.target.checked}))} />
              <span>Secure Transaction</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" name="payOnDelivery" checked={form.payOnDelivery} onChange={(e) => setForm(prev => ({...prev, payOnDelivery: e.target.checked}))} />
              <span>Pay on Delivery</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" name="easyTracking" checked={form.easyTracking} onChange={(e) => setForm(prev => ({...prev, easyTracking: e.target.checked}))} />
              <span>Easy Tracking</span>
            </label>
            <label className="flex items-center space-x-2">
              <input type="checkbox" name="freeDelivery" checked={form.freeDelivery} onChange={(e) => setForm(prev => ({...prev, freeDelivery: e.target.checked}))} />
              <span>Free Delivery</span>
            </label>
          </div>
        </div>

        {/* Shipping */}
        <div>
          <h4 className="font-medium text-slate-900 mb-3">Shipping & Returns</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center space-x-2 mb-2">
                <input type="checkbox" name="isFreeShipping" checked={form.isFreeShipping} onChange={(e) => setForm(prev => ({...prev, isFreeShipping: e.target.checked}))} />
                <span>Free Shipping</span>
              </label>
              <input className="border rounded-lg px-3 py-2 w-full" name="shippingType" placeholder="Shipping Type" onChange={onChange} value={form.shippingType} />
              <input className="border rounded-lg px-3 py-2 w-full mt-2" name="estimatedDelivery" placeholder="Estimated Delivery" onChange={onChange} value={form.estimatedDelivery} />
            </div>
            <div>
              <label className="flex items-center space-x-2 mb-2">
                <input type="checkbox" name="isReturnable" checked={form.isReturnable} onChange={(e) => setForm(prev => ({...prev, isReturnable: e.target.checked}))} />
                <span>Returnable</span>
              </label>
              <textarea className="border rounded-lg px-3 py-2 w-full" rows="3" name="returnPolicy" placeholder="Return Policy" onChange={onChange} value={form.returnPolicy} />
            </div>
          </div>
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

