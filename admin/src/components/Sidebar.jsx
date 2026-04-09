import { NavLink, useNavigate, useLocation } from 'react-router-dom'

const navItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Products', to: '/products' },
  { label: 'Categories', to: '/categories' },
  { label: 'Orders', to: '/orders' },
  { label: 'Users', to: '/users' },
  { label: 'Coupons', to: '/coupons' },
]

const Sidebar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    navigate('/login')
  }

  const isActive = (path) => {
    if (path === '/orders') {
      return location.pathname.startsWith('/orders')
    }
    return location.pathname === path || location.pathname.startsWith(`${path}/`)
  }

  return (
    <aside className="hidden md:flex md:w-64 shrink-0 bg-slate-900 text-white min-h-screen flex-col">
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-lg font-semibold">Admin Panel</h1>
      </div>

      <nav className="p-4 space-y-2 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={() =>
              `block px-3 py-2 rounded-lg text-sm transition ${
                isActive(item.to) ? 'bg-white text-slate-900 font-semibold' : 'text-slate-200 hover:bg-slate-800'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full rounded-lg bg-rose-500 hover:bg-rose-600 text-white py-2 text-sm font-medium transition"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}

export default Sidebar

