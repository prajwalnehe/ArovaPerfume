import { useEffect, useState } from 'react'
import { ordersAPI } from '../services/api'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await ordersAPI.getAll()
      const data = res?.data?.data || []
      setOrders(Array.isArray(data) ? data : [])
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await ordersAPI.updateStatus(id, newStatus)
      setMessage('Order status updated successfully.')
      setOrders((prev) =>
        prev.map((order) =>
          (order._id || order.id) === id ? { ...order, status: newStatus } : order
        )
      )
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to update status')
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'shipped':
        return 'bg-blue-100 text-blue-800'
      case 'delivered':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">All Orders</h3>
      </div>

      {message && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading orders...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3">Order ID</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Date</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const id = order._id || order.id
                const customerName = order.user?.name || order.customerName || 'N/A'
                const total = order.totalAmount || order.total || 0
                const status = order.status || 'pending'
                const date = new Date(order.createdAt || order.date).toLocaleDateString()

                return (
                  <tr key={id} className="border-b border-slate-100 last:border-none">
                    <td className="px-4 py-3 font-mono text-xs">#{id.slice(-8)}</td>
                    <td className="px-4 py-3">{customerName}</td>
                    <td className="px-4 py-3">₹{Number(total).toLocaleString()}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                      </span>
                    </td>
                    <td className="px-4 py-3">{date}</td>
                    <td className="px-4 py-3">
                      <select
                        value={status}
                        onChange={(e) => handleStatusUpdate(id, e.target.value)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      >
                        <option value="pending">Pending</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
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

export default Orders
