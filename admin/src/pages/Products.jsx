import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { productsAPI } from '../services/api'

const Products = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await productsAPI.getAll()
      const data = res?.data || []
      setProducts(Array.isArray(data) ? data : [])
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleDelete = async (id) => {
    const ok = window.confirm('Are you sure you want to delete this product?')
    if (!ok) return
    try {
      await productsAPI.remove(id)
      setMessage('Product deleted successfully.')
      setProducts((prev) => prev.filter((p) => (p._id || p.id) !== id))
    } catch (error) {
      setMessage(error.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">All Products</h3>
        <Link
          to="/products/add"
          className="rounded-lg bg-slate-900 px-4 py-2 text-white text-sm hover:bg-slate-800"
        >
          Add Product
        </Link>
      </div>

      {message && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading products...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Brand</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Gender</th>
                <th className="text-left px-4 py-3">Price</th>
                <th className="text-left px-4 py-3">Stock</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const id = p._id || p.id
                const title = p.title || p.name || 'Untitled'
                const brand = p.brand || '-'
                const category = p.category || p.catagory || '-'
                const gender = p.gender || '-'
                
                // Extract price from pricing object (new model) or fallback to old structure
                const salePrice = p.pricing?.salePrice || p.salePrice || p.price
                const mrp = p.pricing?.mrp || p.mrp
                const displayPrice = salePrice || mrp || 0
                
                // Extract stock from stock object or fallback
                const stock = p.stock?.quantity || p.stock || 0
                const sku = p.stock?.sku || p.sku || ''

                return (
                  <tr key={id} className="border-b border-slate-100 last:border-none">
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <div className="font-medium text-slate-900">{title}</div>
                        {sku && <div className="text-xs text-slate-500">SKU: {sku}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">{brand}</td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">{category}</div>
                        {p.subcategory && <div className="text-xs text-slate-500">{p.subcategory}</div>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        gender === 'Men' ? 'bg-blue-100 text-blue-800' :
                        gender === 'Women' ? 'bg-pink-100 text-pink-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {gender}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium">₹{Number(displayPrice).toLocaleString()}</div>
                        {mrp && mrp !== displayPrice && (
                          <div className="text-xs text-slate-500 line-through">₹{Number(mrp).toLocaleString()}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        stock > 10 ? 'bg-green-100 text-green-800' :
                        stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {stock} units
                      </span>
                    </td>
                    <td className="px-4 py-3 space-x-2">
                      <Link
                        to={`/products/edit/${id}`}
                        className="inline-block rounded-md border border-slate-300 px-3 py-1.5 hover:bg-slate-50"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(id)}
                        className="rounded-md border border-rose-300 text-rose-600 px-3 py-1.5 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default Products

