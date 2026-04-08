import { useEffect, useState } from 'react'
import { dashboardAPI } from '../services/api'

const StatCard = ({ title, value, loading }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
    <p className="text-sm text-slate-500">{title}</p>
    <h3 className="text-3xl font-bold text-slate-900 mt-2">
      {loading ? '...' : value}
    </h3>
  </div>
)

const Dashboard = () => {
  const [stats, setStats] = useState({ users: 0, products: 0, orders: 0, revenue: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const res = await dashboardAPI.getStats()
        const data = res?.data || {}
        
        setStats({
          users: data.usersCount || data.totalUsers || data.users || 0,
          products: data.productsCount || data.totalProducts || data.products || 0,
          orders: data.ordersCount || data.totalOrders || data.orders || 0,
          revenue: data.revenue || data.totalRevenue || 0,
        })
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard stats')
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={stats.users} loading={loading} />
        <StatCard title="Total Products" value={stats.products} loading={loading} />
        <StatCard title="Total Orders" value={stats.orders} loading={loading} />
        <StatCard title="Revenue" value={`₹${stats.revenue}`} loading={loading} />
      </div>
    </div>
  )
}

export default Dashboard

