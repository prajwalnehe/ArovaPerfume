import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ordersAPI } from '../services/api'

const OrderDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('success')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchOrderDetails()
  }, [id])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const res = await ordersAPI.getById(id)
      setOrder(res?.data || null)
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to load order details', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (msg, type = 'success') => {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleStatusUpdate = async (newStatus) => {
    try {
      setUpdating(true)
      await ordersAPI.updateStatus(id, newStatus)
      showMessage('Order status updated successfully.')
      setOrder(prev => ({ ...prev, orderStatus: newStatus, status: newStatus }))
    } catch (error) {
      showMessage(error.response?.data?.message || 'Failed to update status', 'error')
    } finally {
      setUpdating(false)
    }
  }

  const getOrderStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'created':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'confirmed':
      case 'packed':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'shipped':
      case 'on_the_way':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'returned':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPaymentStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'paid':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'refunded':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return '✅'
      case 'cancelled':
        return '❌'
      case 'shipped':
        return '🚚'
      case 'packed':
        return '📦'
      default:
        return '⏳'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatPrice = (price) => {
    return `₹${Number(price || 0).toLocaleString('en-IN')}`
  }

  const getOrderTimeline = (currentStatus) => {
    const statuses = ['pending', 'confirmed', 'packed', 'shipped', 'delivered']
    const currentIndex = statuses.indexOf(currentStatus?.toLowerCase())
    
    if (currentStatus?.toLowerCase() === 'cancelled') {
      return [
        { label: 'Order Placed', completed: true },
        { label: 'Cancelled', completed: true, isCancelled: true }
      ]
    }
    
    return statuses.map((status, index) => ({
      label: status.charAt(0).toUpperCase() + status.slice(1),
      completed: index <= currentIndex,
      current: index === currentIndex
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-blue-500"></div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-4xl">
          📦
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-1">Order Not Found</h3>
        <p className="text-sm text-slate-500 mb-4">The order you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/orders')}
          className="px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
        >
          Back to Orders
        </button>
      </div>
    )
  }

  const orderStatus = order.orderStatus || order.status || 'pending'
  const paymentStatus = order.paymentStatus || (order.status === 'paid' ? 'paid' : 'pending')
  const paymentMethod = order.paymentMethod || 'cod'
  const items = order.items || []
  const address = order.shippingAddress || order.address || {}
  const user = order.user || {}
  const timeline = getOrderTimeline(orderStatus)

  return (
    <div className="space-y-6">
      {/* Back Button & Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <span>←</span>
          <span className="text-sm font-medium">Back to Orders</span>
        </button>
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

      {/* Order Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-xl">
              <span className="text-3xl">📦</span>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  Order #{String(order._id).slice(-8).toUpperCase()}
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${getOrderStatusColor(orderStatus)}`}>
                  <span>{getStatusIcon(orderStatus)}</span>
                  {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                </span>
              </div>
              <p className="text-sm text-slate-500 mt-1">
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
          </div>

          {/* Update Status */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">Update Status:</span>
            <select
              value={orderStatus}
              onChange={(e) => handleStatusUpdate(e.target.value)}
              disabled={updating}
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
              <option value="returned">Returned</option>
            </select>
          </div>
        </div>

        {/* Order Timeline */}
        <div className="mt-8 pt-6 border-t border-slate-200">
          <div className="flex items-center justify-between">
            {timeline.map((step, index) => (
              <div key={step.label} className="flex items-center flex-1 last:flex-0">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                    step.isCancelled 
                      ? 'bg-red-100 text-red-600'
                      : step.completed 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'bg-slate-100 text-slate-400'
                  }`}>
                    {step.isCancelled ? '❌' :
                     step.label === 'Delivered' ? '✅' :
                     step.label === 'Shipped' ? '🚚' :
                     step.label === 'Packed' ? '📦' :
                     '⏳'}
                  </div>
                  <span className={`text-xs font-medium mt-2 ${
                    step.isCancelled ? 'text-red-600' :
                    step.completed ? 'text-slate-900' : 'text-slate-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < timeline.length - 1 && (
                  <div className={`flex-1 h-1 mx-2 ${
                    step.completed && !step.isCancelled ? 'bg-blue-500' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Order Items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Section */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <span>📦</span>
                Order Items ({items.length})
              </h2>
            </div>
            <div className="divide-y divide-slate-200">
              {items.map((item, index) => {
                const product = item.product || {}
                // Use saved item data first, fall back to product data
                const image = item.image || product.images?.[0] || product.image || '/no-image.png'
                const title = item.name || product.title || product.name || 'Product'
                const brand = product.brand || item.brand || ''
                const price = item.price || 0
                const quantity = item.quantity || 1
                const size = item.size || ''
                const itemTotal = price * quantity

                return (
                  <div key={index} className="p-6 flex gap-4">
                    <img
                      src={image}
                      alt={title}
                      className="w-24 h-24 object-cover rounded-lg border border-slate-200"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{title}</h3>
                      {brand && <p className="text-sm text-slate-500">{brand}</p>}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-sm font-medium text-slate-900">{formatPrice(price)}</span>
                        <span className="text-sm text-slate-500">× {quantity}</span>
                        {size && <span className="text-sm text-slate-500">Size: {size}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900">{formatPrice(itemTotal)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            {/* Price Breakdown */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
              <h4 className="text-xs font-semibold text-slate-500 uppercase mb-3">Price Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Items Price ({items.length} item{items.length > 1 ? 's' : ''})</span>
                  <span className="text-slate-900">{formatPrice(order.itemsPrice ?? items.reduce((sum, it) => sum + ((it.price || 0) * (it.quantity || 1)), 0))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">
                    Tax {(() => {
                      const ip = order.itemsPrice ?? items.reduce((sum, it) => sum + ((it.price || 0) * (it.quantity || 1)), 0);
                      const tp = order.taxPrice ?? 0;
                      if (ip > 0 && tp > 0) {
                        const pct = Math.round((tp / ip) * 100);
                        return `(${pct}%)`;
                      }
                      return '';
                    })()}
                  </span>
                  <span className="text-slate-900">{formatPrice(order.taxPrice ?? 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Shipping</span>
                  <span className={order.shippingPrice === 0 ? 'text-green-600' : 'text-slate-900'}>
                    {(order.shippingPrice ?? 0) === 0 ? 'FREE' : formatPrice(order.shippingPrice ?? 0)}
                  </span>
                </div>
                {(order.discount ?? order.couponDiscount) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-green-700 font-medium">
                      Discount {order.couponCode && `(${order.couponCode})`}
                    </span>
                    <span className="text-green-600 font-medium">-{formatPrice(order.discount ?? order.couponDiscount)}</span>
                  </div>
                )}
                <div className="border-t border-slate-300 my-2 pt-2">
                  <div className="flex justify-between font-semibold text-base">
                    <span className="text-slate-900">Total Price</span>
                    <span className="text-slate-900">{formatPrice(order.totalPrice ?? order.amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <span>💳</span>
              Payment Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-slate-500 mb-1">Payment Method</p>
                <p className="font-medium text-slate-900 capitalize">{paymentMethod}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Payment Status</p>
                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium border ${getPaymentStatusColor(paymentStatus)}`}>
                  {paymentStatus.charAt(0).toUpperCase() + paymentStatus.slice(1)}
                </span>
              </div>
              {order.transactionId && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Transaction ID</p>
                  <p className="font-medium text-slate-900 font-mono text-xs">{order.transactionId}</p>
                </div>
              )}
              {order.razorpayPaymentId && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Razorpay Payment ID</p>
                  <p className="font-medium text-slate-900 font-mono text-xs">{order.razorpayPaymentId}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Customer & Shipping */}
        <div className="space-y-6">
          {/* Customer Information */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <span>👤</span>
              Customer
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500 mb-1">Name</p>
                <p className="font-medium text-slate-900">{user.name || address.fullName || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-500 mb-1">Email</p>
                <p className="font-medium text-slate-900">{user.email || 'N/A'}</p>
              </div>
              {address.mobileNumber && (
                <div>
                  <p className="text-sm text-slate-500 mb-1">Phone</p>
                  <p className="font-medium text-slate-900">{address.mobileNumber}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <span>📍</span>
              Shipping Address
            </h2>
            {address.address ? (
              <div className="space-y-2 text-sm">
                <p className="font-medium text-slate-900">{address.fullName}</p>
                <p className="text-slate-600">{address.address}</p>
                {address.locality && <p className="text-slate-600">{address.locality}</p>}
                {address.landmark && <p className="text-slate-500">Landmark: {address.landmark}</p>}
                <p className="text-slate-600">
                  {address.city}, {address.state} - {address.pincode}
                </p>
                {address.mobileNumber && (
                  <p className="text-slate-600 mt-2">Phone: {address.mobileNumber}</p>
                )}
                {address.alternatePhone && (
                  <p className="text-slate-500">Alt Phone: {address.alternatePhone}</p>
                )}
                {address.addressType && (
                  <span className="inline-block mt-2 px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs capitalize">
                    {address.addressType}
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No shipping address available</p>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
              <span>📅</span>
              Order Summary
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Order ID</span>
                <span className="font-medium text-slate-900 font-mono">{String(order._id).slice(-8).toUpperCase()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Order Date</span>
                <span className="font-medium text-slate-900">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Items</span>
                <span className="font-medium text-slate-900">{items.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Amount</span>
                <span className="font-bold text-slate-900">{formatPrice(order.totalPrice ?? order.amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetails
