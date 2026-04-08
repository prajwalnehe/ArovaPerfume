import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { getMyAddress, getMyOrders } from '../services/api';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { FiSettings, FiUser, FiPackage, FiMapPin, FiLogOut, FiRefreshCw, FiShoppingBag, FiMail, FiPhone, FiEdit2, FiHeart, FiHome } from 'react-icons/fi';
import ProductImage from '../components/ProductImage';

export default function Profile() {
  const initialTab = (() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      return tab && ['orders', 'profile', 'addresses'].includes(tab) ? tab : 'profile';
    } catch {
      return 'profile';
    }
  })();
  const [activeSection, setActiveSection] = useState(initialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobile: '',
    gender: 'male'
  });
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const StatusBadge = ({ status }) => {
    const s = String(status || '').toLowerCase();
    const map = {
      created: 'bg-amber-50 text-amber-700 border border-amber-200',
      confirmed: 'bg-blue-50 text-blue-700 border border-blue-200',
      on_the_way: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
      delivered: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
      failed: 'bg-rose-50 text-rose-700 border border-rose-200',
      paid: 'bg-green-50 text-green-700 border border-green-200',
      pending: 'bg-gray-50 text-gray-700 border border-gray-200',
    };
    const cls = map[s] || 'bg-gray-50 text-gray-700 border border-gray-200';
    return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${cls}`}>{String(status).replace(/_/g, ' ').toUpperCase()}</span>;
  };

  const fetchUserData = async () => {
    try {
      const userData = await api.me();
      const [firstName, ...lastNameParts] = userData.user?.name?.split(' ') || [];
      const lastName = lastNameParts.join(' ');
      const adminStatus = !!userData.user?.isAdmin;
      try {
        if (adminStatus) {
          localStorage.setItem('auth_is_admin', 'true');
        } else {
          localStorage.removeItem('auth_is_admin');
        }
      } catch {}

      setUser({
        firstName: firstName || '',
        lastName: lastName || '',
        email: userData.user?.email || '',
        mobile: userData.user?.phone || '',
        gender: userData.user?.gender || 'male'
      });
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const addressData = await getMyAddress();
      if (addressData && addressData._id) {
        setAddresses([addressData]);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      setAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchAddresses();
    
    // Load wishlist count
    const readWishlistCount = () => {
      try {
        const raw = localStorage.getItem('wishlist');
        const list = raw ? JSON.parse(raw) : [];
        setWishlistCount(Array.isArray(list) ? list.length : 0);
      } catch {
        setWishlistCount(0);
      }
    };
    readWishlistCount();
    const onStorage = (e) => {
      if (!e || e.key === 'wishlist') readWishlistCount();
    };
    const onCustom = () => readWishlistCount();
    window.addEventListener('storage', onStorage);
    window.addEventListener('wishlist:updated', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('wishlist:updated', onCustom);
    };
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab && ['profile'].includes(tab)) {
      setActiveSection(tab);
    } else {
      setActiveSection('profile');
    }
  }, [location.search]);


  const refreshOrders = async () => {
    try {
      setLoadingOrders(true);
      const data = await getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_is_admin');
      navigate('/signin');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleSectionChange = (section) => {
    setActiveSection(section);
    setMobileMenuOpen(false);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="relative inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-black"></div>
          </div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white lg:bg-gray-50">
      <div className="flex flex-col lg:flex-row">
        {/* Mobile Header */}
        <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30" style={{ top: 'var(--app-header-height, 0px)' }}>
          <div className="px-4 py-3 flex items-center justify-between bg-white">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-800 text-lg font-bold shadow-sm">
                {user.firstName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-xs text-gray-500">Hello,</div>
                <div className="font-semibold text-gray-900">{user.firstName} {user.lastName}</div>
              </div>
            </div>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <aside className={`
          fixed lg:static inset-y-0 z-40 lg:z-0
          transform ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
          transition-transform duration-300 ease-in-out
          w-72 bg-white border-r border-gray-200 shadow-xl lg:shadow-none
          flex flex-col
        `} style={{ top: 'var(--app-header-height, 0px)' }}>
          {/* Overlay for mobile */}
          {mobileMenuOpen && (
            <div 
              className="lg:hidden fixed inset-0 bg-gray-900 bg-opacity-30 -z-10"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* User Profile Header - Desktop */}
          <div className="hidden lg:block p-6 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center text-gray-800 text-2xl font-bold shadow-sm ring-2 ring-gray-100">
                {user.firstName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-500 font-medium mb-1">Welcome back,</div>
                <div className="font-bold text-gray-900 text-lg truncate">{user.firstName} {user.lastName}</div>
                <div className="text-xs text-gray-500 truncate">{user.email}</div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 bg-white lg:bg-transparent">
            <div className="space-y-2">
              {/* Quick Actions */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">Quick Actions</div>
                <Link to="/" className="block">
                  <div className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-50 bg-white border border-gray-200 hover:border-gray-300">
                    <div className="p-2 rounded-lg bg-gray-100">
                      <FiHome className="w-5 h-5 text-gray-700" />
                    </div>
                    <span className="font-medium">Back to Home</span>
                    <span className="ml-auto text-gray-400">›</span>
                  </div>
                </Link>
              </div>

              {/* Main Menu */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">My Account</div>
                <button
                  onClick={() => handleSectionChange('profile')}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 relative ${
                    activeSection === 'profile'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50 bg-white border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${activeSection === 'profile' ? 'bg-white/20' : 'bg-gray-100'}`}>
                    <FiUser className={`w-5 h-5 ${activeSection === 'profile' ? 'text-white' : 'text-gray-700'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">Profile</div>
                    <div className={`text-xs ${activeSection === 'profile' ? 'text-white/80' : 'text-gray-500'}`}>
                      Personal information
                    </div>
                  </div>
                  {activeSection === 'profile' && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </button>

                <Link to="/wishlist" className="block mt-2">
                  <div className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-gray-700 hover:bg-gray-50 bg-white border border-gray-200 hover:border-gray-300 relative">
                    <div className="p-2 rounded-lg bg-gray-100">
                      <FiHeart className="w-5 h-5 text-gray-700" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold">Wishlist</div>
                      <div className="text-xs text-gray-500">
                        {wishlistCount} {wishlistCount === 1 ? 'item' : 'items'} saved
                      </div>
                    </div>
                    {wishlistCount > 0 && (
                      <span className="absolute right-12 top-1/2 -translate-y-1/2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                        {wishlistCount > 9 ? '9+' : wishlistCount}
                      </span>
                    )}
                    <span className="text-gray-400">›</span>
                  </div>
                </Link>
              </div>

              {/* Admin Section */}
              {isAdmin && (
                <div className="mb-4">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 mb-2">Administration</div>
                  <Link to="/admin" className="block">
                    <div className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-blue-700 hover:bg-blue-50 bg-white border border-blue-200 hover:border-blue-300">
                      <div className="p-2 rounded-lg bg-blue-100">
                        <FiSettings className="w-5 h-5 text-blue-700" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">Admin Dashboard</div>
                        <div className="text-xs text-blue-600">Manage store & orders</div>
                      </div>
                      <span className="text-blue-400">›</span>
                    </div>
                  </Link>
                </div>
              )}

              {/* Divider */}
              <div className="my-4 border-t border-gray-200"></div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 text-red-600 hover:bg-red-50 bg-white border border-red-200 hover:border-red-300"
              >
                <div className="p-2 rounded-lg bg-red-100">
                  <FiLogOut className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold">Logout</div>
                  <div className="text-xs text-red-500">Sign out of your account</div>
                </div>
              </button>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-white lg:bg-transparent">
          <div className="max-w-6xl mx-auto">
            {/* Mobile Tab Navigation */}
            <div className="lg:hidden mb-6">
              <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200">
                <button
                  onClick={() => handleSectionChange('profile')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                    activeSection === 'profile'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-white'
                  }`}
                >
                  Profile
                </button>
              </div>
            </div>

            {/* Profile Section */}
            {activeSection === 'profile' && (
              <div className="space-y-6">
                {/* Profile Header Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-black to-gray-800 px-6 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-3xl font-bold ring-4 ring-white/30">
                        {user.firstName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h1 className="text-2xl font-bold text-white mb-1">{user.firstName} {user.lastName}</h1>
                        <p className="text-gray-300 text-sm">{user.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FiUser className="w-5 h-5" />
                      Personal Information
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium">
                          {user.firstName || '—'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                        <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium">
                          {user.lastName || '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <FiMail className="w-5 h-5" />
                      Contact Information
                    </h2>
                  </div>
                  <div className="p-6 space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FiMail className="w-4 h-4" />
                        Email Address
                      </label>
                      <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium">
                        {user.email || '—'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <FiPhone className="w-4 h-4" />
                        Mobile Number
                      </label>
                      <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 font-medium">
                        {user.mobile || '—'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Section */}
            {activeSection === 'orders' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FiPackage className="w-5 h-5" />
                    My Orders
                  </h2>
                  <button
                    onClick={refreshOrders}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    <FiRefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
                <div className="p-6">
                  {loadingOrders ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black"></div>
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.map((order) => {
                        const dateTime = formatDate(order.createdAt);
                        return (
                          <div key={order._id} className="border-2 border-gray-200 rounded-xl p-5 hover:border-black hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                              <div>
                                <div className="text-xs text-gray-500 mb-1">Order ID</div>
                                <div className="font-mono font-semibold text-gray-900">#{String(order._id).slice(-8).toUpperCase()}</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <StatusBadge status={order.status || order.orderStatus} />
                                <div className="text-lg font-bold text-gray-900">₹{Number(order.amount || 0).toLocaleString('en-IN')}</div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mb-4">
                              <div>{dateTime.date}</div>
                              <div>{dateTime.time}</div>
                            </div>
                            <div className="space-y-3 pt-4 border-t border-gray-200">
                              {order.items?.map((it, idx) => (
                                <div key={idx} className="flex items-center gap-4">
                                  <ProductImage
                                    src={it.product?.images?.image1}
                                    alt={it.product?.title || ''}
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-gray-900 truncate">{it.product?.title || 'Product'}</div>
                                    <div className="text-sm text-gray-600">Quantity: {it.quantity} × ₹{Number(it.price || 0).toLocaleString('en-IN')}</div>
                                  </div>
                                  <div className="font-semibold text-gray-900">₹{Number((it.price || 0) * (it.quantity || 1)).toLocaleString('en-IN')}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                        <FiShoppingBag className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No Orders Yet</h3>
                      <p className="text-gray-600 mb-6">You haven't placed any orders yet. Start shopping now!</p>
                      <button 
                        onClick={() => navigate('/')} 
                        className="px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm"
                      >
                        Start Shopping
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Addresses Section */}
            {activeSection === 'addresses' && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FiMapPin className="w-5 h-5" />
                    My Addresses
                  </h2>
                  <Link
                    to="/checkout/address"
                    className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                  >
                    <FiEdit2 className="w-4 h-4" />
                    Add Address
                  </Link>
                </div>
                <div className="p-6">
                  {loadingAddresses ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-black"></div>
                    </div>
                  ) : addresses.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {addresses.map((address, index) => (
                        <div key={index} className="border-2 border-gray-200 rounded-xl p-5 hover:border-black hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-gray-50">
                          <div className="flex justify-between items-start mb-4">
                            <h3 className="font-bold text-gray-900 text-lg">{address.fullName}</h3>
                            {address.isDefault && (
                              <span className="px-3 py-1 text-xs font-bold bg-black text-white rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="space-y-2 text-sm text-gray-700">
                            <p className="leading-relaxed">{address.address || address.addressLine1}</p>
                            {address.landmark && (
                              <p className="text-gray-600">Landmark: {address.landmark}</p>
                            )}
                            <p className="font-medium text-gray-900">
                              {address.city}, {address.state} - {address.pincode}
                            </p>
                            <div className="flex items-center gap-2 pt-3 mt-3 border-t border-gray-200">
                              <FiPhone className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-900">{address.mobileNumber || address.alternatePhone || '—'}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 mb-4">
                        <FiMapPin className="w-10 h-10 text-gray-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">No Addresses Saved</h3>
                      <p className="text-gray-600 mb-6">You haven't added any addresses yet.</p>
                      <Link
                        to="/checkout/address"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-sm"
                      >
                        <FiEdit2 className="w-4 h-4" />
                        Add New Address
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
