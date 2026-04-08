import { useEffect, useState } from 'react'
import { usersAPI } from '../services/api'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const res = await usersAPI.getAll()
      const data = res?.data?.data || []
      setUsers(Array.isArray(data) ? data : [])
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleDelete = async (id) => {
    const ok = window.confirm('Are you sure you want to delete this user? This action cannot be undone.')
    if (!ok) return
    try {
      await usersAPI.remove(id)
      setMessage('User deleted successfully.')
      setUsers((prev) => prev.filter((user) => (user._id || user.id) !== id))
    } catch (error) {
      setMessage(error.response?.data?.message || 'Delete failed')
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-900">All Users</h3>
      </div>

      {message && (
        <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
        {loading ? (
          <div className="p-6 text-sm text-slate-500">Loading users...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3">Name</th>
                <th className="text-left px-4 py-3">Email</th>
                <th className="text-left px-4 py-3">Phone</th>
                <th className="text-left px-4 py-3">Joined</th>
                <th className="text-left px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const id = user._id || user.id
                const name = user.name || user.fullName || 'N/A'
                const email = user.email || 'N/A'
                const phone = user.phone || user.phoneNumber || 'N/A'
                const joinedDate = new Date(user.createdAt || user.joinedDate).toLocaleDateString()

                return (
                  <tr key={id} className="border-b border-slate-100 last:border-none">
                    <td className="px-4 py-3 font-medium">{name}</td>
                    <td className="px-4 py-3">{email}</td>
                    <td className="px-4 py-3">{phone}</td>
                    <td className="px-4 py-3">{joinedDate}</td>
                    <td className="px-4 py-3">
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

export default Users
