import { useLocation } from 'react-router-dom'

const titleMap = {
  '/dashboard': 'Dashboard',
  '/products': 'Products',
  '/products/add': 'Add Product',
  '/categories': 'Categories',
}

const Navbar = () => {
  const location = useLocation()
  const pageTitle = location.pathname.startsWith('/products/edit/')
    ? 'Edit Product'
    : (titleMap[location.pathname] || 'Admin')

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200">
      <div className="px-4 md:px-6 py-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">{pageTitle}</h2>
        <span className="text-xs md:text-sm text-slate-500">Admin Console</span>
      </div>
    </header>
  )
}

export default Navbar

