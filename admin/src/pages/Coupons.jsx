import { useEffect, useState } from 'react'
import { couponAPI } from '../services/api'

const Coupons = () => {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [showForm, setShowForm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteCouponId, setDeleteCouponId] = useState(null)
  const [editingCoupon, setEditingCoupon] = useState(null)

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percentage',
    discountValue: '',
    minOrderAmount: '0',
    maxDiscount: '',
    expiryDate: '',
    usageLimit: '',
    isActive: true,
    isFirstOrderOnly: false
  })

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const res = await couponAPI.getAll()
      setCoupons(res?.data?.data || [])
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to load coupons', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCoupons()
  }, [])

  const showMessage = (msg, type = 'success') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const resetForm = () => {
    setFormData({
      code: '',
      discountType: 'percentage',
      discountValue: '',
      minOrderAmount: '0',
      maxDiscount: '',
      expiryDate: '',
      usageLimit: '',
      isActive: true,
      isFirstOrderOnly: false
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.code || !formData.discountValue || !formData.expiryDate) {
      showMessage('Please fill all required fields', 'error')
      return
    }

    const payload = {
      code: formData.code.toUpperCase().trim(),
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minOrderAmount: Number(formData.minOrderAmount) || 0,
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
      expiryDate: formData.expiryDate,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      isActive: formData.isActive,
      isFirstOrderOnly: formData.isFirstOrderOnly
    }

    try {
      await couponAPI.create(payload)
      showMessage('Coupon created successfully!')
      resetForm()
      setShowForm(false)
      fetchCoupons()
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to create coupon', 'error')
    }
  }

  const confirmDelete = (id) => {
    setDeleteCouponId(id)
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    try {
      await couponAPI.remove(deleteCouponId)
      showMessage('Coupon deleted successfully!')
      fetchCoupons()
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to delete coupon', 'error')
    } finally {
      setShowDeleteConfirm(false)
      setDeleteCouponId(null)
    }
  }

  const handleToggleStatus = async (id) => {
    try {
      await couponAPI.toggleStatus(id)
      showMessage('Coupon status updated!')
      fetchCoupons()
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to toggle status', 'error')
    }
  }

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon)
    setFormData({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minOrderAmount: coupon.minOrderAmount || '0',
      maxDiscount: coupon.maxDiscount || '',
      expiryDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
      usageLimit: coupon.usageLimit || '',
      isActive: coupon.isActive,
      isFirstOrderOnly: coupon.isFirstOrderOnly
    })
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!editingCoupon) return

    const payload = {
      discountType: formData.discountType,
      discountValue: Number(formData.discountValue),
      minOrderAmount: Number(formData.minOrderAmount) || 0,
      maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
      expiryDate: formData.expiryDate,
      usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
      isActive: formData.isActive,
      isFirstOrderOnly: formData.isFirstOrderOnly
    }

    try {
      await couponAPI.update(editingCoupon._id, payload)
      showMessage('Coupon updated successfully!')
      resetForm()
      setShowForm(false)
      setEditingCoupon(null)
      fetchCoupons()
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to update coupon', 'error')
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatPrice = (price) => {
    return `₹${Number(price || 0).toLocaleString('en-IN')}`
  }

  const getStatusBadge = (coupon) => {
    const now = new Date()
    const expiry = new Date(coupon.expiryDate)
    const isExpired = now > expiry
    const isLimitReached = coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit

    if (!coupon.isActive) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">Inactive</span>
    }
    if (coupon.status === 'inactive') {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">Inactive</span>
    }
    if (isExpired) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-red-100 text-red-700 border-red-200">Expired</span>
    }
    if (isLimitReached) {
      return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-orange-100 text-orange-700 border-orange-200">Limit Reached</span>
    }
    return <span className="px-2.5 py-1 rounded-full text-xs font-medium border bg-green-100 text-green-700 border-green-200">Active</span>
  }

  // Calculate today's date + 1 for min date in expiry
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg text-2xl">
            🎟️
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Coupons</h1>
            <p className="text-sm text-slate-500">Manage discount coupons</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500">Total: {coupons.length}</span>
          <button
            onClick={() => {
              if (showForm && editingCoupon) {
                setEditingCoupon(null)
                resetForm()
              }
              setShowForm(!showForm)
            }}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
          >
            {showForm ? (editingCoupon ? 'Cancel Edit' : 'Cancel') : '+ Create Coupon'}
          </button>
        </div>
      </div>

      {/* Message Toast */}
      {message && (
        <div className={`rounded-lg border p-4 text-sm ${
          messageType === 'error' 
            ? 'border-red-200 bg-red-50 text-red-700' 
            : 'border-green-200 bg-green-50 text-green-700'
        }`}>
          {message}
        </div>
      )}

      {/* Create/Edit Coupon Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            {editingCoupon ? 'Edit Coupon' : 'Create New Coupon'}
          </h2>
          <form onSubmit={editingCoupon ? handleUpdate : handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Coupon Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleInputChange}
                placeholder="e.g., SUMMER50"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 uppercase disabled:bg-slate-100 disabled:cursor-not-allowed"
                disabled={editingCoupon}
                required
              />
              {editingCoupon && (
                <p className="text-xs text-slate-500 mt-1">Code cannot be changed</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Discount Type <span className="text-red-500">*</span>
              </label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Discount Value <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleInputChange}
                placeholder={formData.discountType === 'percentage' ? 'e.g., 20' : 'e.g., 500'}
                min="0"
                max={formData.discountType === 'percentage' ? '100' : null}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Min Order Amount (₹)
              </label>
              <input
                type="number"
                name="minOrderAmount"
                value={formData.minOrderAmount}
                onChange={handleInputChange}
                placeholder="e.g., 1000"
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Discount (₹) {formData.discountType === 'percentage' && '(Optional)'}
              </label>
              <input
                type="number"
                name="maxDiscount"
                value={formData.maxDiscount}
                onChange={handleInputChange}
                placeholder="e.g., 500"
                min="0"
                disabled={formData.discountType === 'fixed'}
                className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                  formData.discountType === 'fixed' ? 'bg-slate-100 cursor-not-allowed' : ''
                }`}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Expiry Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="expiryDate"
                value={formData.expiryDate}
                onChange={handleInputChange}
                min={today}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Usage Limit (Optional)
              </label>
              <input
                type="number"
                name="usageLimit"
                value={formData.usageLimit}
                onChange={handleInputChange}
                placeholder="Leave empty for unlimited"
                min="1"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-slate-700">Active</span>
              </label>
            </div>

            <div className="flex items-center">
              <label className="flex items-center gap-2 cursor-pointer" title="Only users with no previous orders can use this coupon">
                <input
                  type="checkbox"
                  name="isFirstOrderOnly"
                  checked={formData.isFirstOrderOnly}
                  onChange={handleInputChange}
                  className="w-4 h-4 text-purple-600 border-slate-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-slate-700">First Order Only 🎉</span>
              </label>
            </div>

            <div className="md:col-span-2 lg:grid-cols-3 flex gap-3">
              <button
                type="submit"
                className="px-5 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
              </button>
              <button
                type="button"
                onClick={() => {
                  resetForm()
                  setEditingCoupon(null)
                  if (!editingCoupon) setShowForm(false)
                }}
                className="px-5 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                {editingCoupon ? 'Cancel' : 'Reset'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Coupons Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-slate-200 border-t-purple-500"></div>
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
              🎟️
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">No Coupons Found</h3>
            <p className="text-sm text-slate-500">Create your first coupon to offer discounts.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Discount</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">First Order Only</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {coupons.map((coupon) => (
                  <tr key={coupon._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-slate-900 bg-slate-100 px-2 py-1 rounded">
                          {coupon.code}
                        </span>
                        {coupon.isFirstOrderOnly && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                            🎉 First Order
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {coupon.discountType === 'percentage' ? (
                        <span className="text-sm text-slate-900">{coupon.discountValue}% off</span>
                      ) : (
                        <span className="text-sm text-slate-900">{formatPrice(coupon.discountValue)} off</span>
                      )}
                      {coupon.discountType === 'percentage' && coupon.maxDiscount && (
                        <p className="text-xs text-slate-500">Max: {formatPrice(coupon.maxDiscount)}</p>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {coupon.isFirstOrderOnly ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                          Yes
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-full">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(coupon)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(coupon._id)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            coupon.isActive
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                          title={coupon.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {coupon.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => handleEdit(coupon)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-200 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(coupon._id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-medium hover:bg-red-200 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Delete Coupon?</h3>
            <p className="text-sm text-slate-500 mb-4">
              This action cannot be undone. The coupon will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Coupons
