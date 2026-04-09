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
  const [selectedOrder, setSelectedOrder] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Order Timeline Component
  const OrderTimeline = ({ status, compact = false }) => {
    const steps = [
      { key: 'pending', label: 'Pending', icon: '⏳' },
      { key: 'confirmed', label: 'Confirmed', icon: '⏳' },
      { key: 'packed', label: 'Packed', icon: '📦' },
      { key: 'shipped', label: 'Shipped', icon: '🚚' },
      { key: 'delivered', label: 'Delivered', icon: '✅' }
    ];
    
    const currentStatus = String(status || '').toLowerCase();
    const cancelled = currentStatus === 'cancelled';
    const returned = currentStatus === 'returned';
    
    // Find current step index
    let currentIndex = steps.findIndex(s => s.key === currentStatus);
    if (currentIndex === -1) currentIndex = 0;
    
    if (compact) {
      // Compact horizontal timeline for order cards
      return (
        <div className="py-2">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = index <= currentIndex && !cancelled;
              const isCurrent = index === currentIndex && !cancelled && !returned;
              
              return (
                <div key={step.key} className="flex flex-col items-center flex-1 relative">
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className={`absolute top-3 left-1/2 w-full h-0.5 ${
                      index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                    }`} style={{ transform: 'translateX(50%)' }} />
                  )}
                  
                  {/* Step circle - smaller for compact */}
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 z-10 ${
                    isCompleted 
                      ? 'bg-green-500 border-green-500 text-white' 
                      : isCurrent
                        ? 'bg-blue-500 border-blue-500 text-white'
                        : 'bg-gray-100 border-gray-300 text-gray-400'
                  }`}>
                    {isCompleted ? '✓' : step.icon}
                  </div>
                  
                  {/* Step label - smaller */}
                  <span className={`text-[10px] mt-1 ${
                    isCompleted || isCurrent ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
          
          {(cancelled || returned) && (
            <div className={`mt-2 p-2 rounded text-center text-xs ${
              cancelled ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
            }`}>
              <span className="mr-1">{cancelled ? '❌' : '🔄'}</span>
              Order {cancelled ? 'Cancelled' : 'Returned'}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="py-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index <= currentIndex && !cancelled;
            const isCurrent = index === currentIndex && !cancelled && !returned;
            
            return (
              <div key={step.key} className="flex flex-col items-center flex-1 relative">
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className={`absolute top-4 left-1/2 w-full h-0.5 ${
                    index < currentIndex ? 'bg-green-500' : 'bg-gray-200'
                  }`} style={{ transform: 'translateX(50%)' }} />
                )}
                
                {/* Step circle */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 z-10 ${
                  isCompleted 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : isCurrent
                      ? 'bg-blue-500 border-blue-500 text-white'
                      : 'bg-gray-100 border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? '✓' : step.icon}
                </div>
                
                {/* Step label */}
                <span className={`text-xs mt-2 font-medium ${
                  isCompleted || isCurrent ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
        
        {(cancelled || returned) && (
          <div className={`mt-4 p-3 rounded-lg text-center ${
            cancelled ? 'bg-red-50 text-red-700' : 'bg-orange-50 text-orange-700'
          }`}>
            <span className="text-lg mr-2">{cancelled ? '❌' : '🔄'}</span>
            <span className="font-medium">Order {cancelled ? 'Cancelled' : 'Returned'}</span>
          </div>
        )}
      </div>
    );
  };

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
    if (tab && ['profile', 'orders', 'addresses'].includes(tab)) {
      setActiveSection(tab);
    } else {
      setActiveSection('profile');
    }
  }, [location.search]);

  // Load orders when orders section is active
  useEffect(() => {
    if (activeSection === 'orders' && orders.length === 0 && !loadingOrders) {
      refreshOrders();
    }
  }, [activeSection]);


  const refreshOrders = async () => {
    try {
      setLoadingOrders(true);
      const data = await getMyOrders();
      // Handle new API response format: { success: true, orders: [...], count: n }
      const ordersArray = data?.orders || (Array.isArray(data) ? data : []);
      setOrders(ordersArray);
    } catch (e) {
      console.error('Error fetching orders:', e);
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

                <button
                  onClick={() => handleSectionChange('orders')}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 mt-2 relative ${
                    activeSection === 'orders'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50 bg-white border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${activeSection === 'orders' ? 'bg-white/20' : 'bg-gray-100'}`}>
                    <FiPackage className={`w-5 h-5 ${activeSection === 'orders' ? 'text-white' : 'text-gray-700'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">My Orders</div>
                    <div className={`text-xs ${activeSection === 'orders' ? 'text-white/80' : 'text-gray-500'}`}>
                      View order history
                    </div>
                  </div>
                  {activeSection === 'orders' && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                  <span className={`${activeSection === 'orders' ? 'text-white/60' : 'text-gray-400'}`}>›</span>
                </button>

                <button
                  onClick={() => handleSectionChange('addresses')}
                  className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 mt-2 relative ${
                    activeSection === 'addresses'
                      ? 'bg-gray-900 text-white shadow-md'
                      : 'text-gray-700 hover:bg-gray-50 bg-white border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${activeSection === 'addresses' ? 'bg-white/20' : 'bg-gray-100'}`}>
                    <FiMapPin className={`w-5 h-5 ${activeSection === 'addresses' ? 'text-white' : 'text-gray-700'}`} />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold">My Addresses</div>
                    <div className={`text-xs ${activeSection === 'addresses' ? 'text-white/80' : 'text-gray-500'}`}>
                      Manage delivery addresses
                    </div>
                  </div>
                  {activeSection === 'addresses' && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                  <span className={`${activeSection === 'addresses' ? 'text-white/60' : 'text-gray-400'}`}>›</span>
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
              <div className="flex gap-2 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
                <button
                  onClick={() => handleSectionChange('profile')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    activeSection === 'profile'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-white'
                  }`}
                >
                  Profile
                </button>
                <button
                  onClick={() => handleSectionChange('orders')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    activeSection === 'orders'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-white'
                  }`}
                >
                  My Orders
                </button>
                <button
                  onClick={() => handleSectionChange('addresses')}
                  className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                    activeSection === 'addresses'
                      ? 'bg-gray-900 text-white shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 bg-white'
                  }`}
                >
                  Addresses
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
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <FiPackage className="w-5 h-5" />
                    My Orders ({orders.length})
                  </h2>
                  <button
                    onClick={refreshOrders}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FiRefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {loadingOrders ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-black"></div>
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order) => {
                      const dateTime = formatDate(order.createdAt);
                      const totalItems = order.items?.reduce((sum, it) => sum + (it.quantity || 1), 0) || 0;
                      
                      // Use priceDetails from backend if available, otherwise calculate
                      const priceDetails = order.priceDetails || {};
                      const itemsPrice = priceDetails.itemsPrice || order.items?.reduce((sum, it) => sum + ((it.price || 0) * (it.quantity || 1)), 0) || 0;
                      const taxPrice = priceDetails.taxPrice || Math.round(itemsPrice * 0.05) || 0;
                      const shippingPrice = priceDetails.shippingPrice || (itemsPrice >= 5000 ? 0 : 99) || 0;
                      const discount = priceDetails.discount || 0;
                      const totalPrice = priceDetails.totalPrice || (itemsPrice + taxPrice + shippingPrice - discount) || order.amount || 0;
                      const couponCode = priceDetails.couponCode;
                      
                      return (
                        <div 
                          key={order._id} 
                          onClick={() => setSelectedOrder(order)}
                          className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        >
                          {/* Order Header */}
                          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-medium text-gray-900">#{order.orderId || String(order._id).slice(-8).toUpperCase()}</span>
                              <span className="text-xs text-gray-500">•</span>
                              <span className="text-xs text-gray-500">{dateTime.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={order.orderStatus || order.status} />
                              <span className="text-xs text-blue-600 font-medium">View Details →</span>
                            </div>
                          </div>

                          {/* Order Timeline - Compact for list view */}
                          <div className="px-4 py-2 bg-white border-b border-gray-100">
                            <OrderTimeline status={order.orderStatus || order.status} compact={true} />
                          </div>

                          {/* Products */}
                          <div className="p-4">
                            {order.items?.map((it, idx) => {
                              const product = it.product;
                              // Use product data if available, otherwise fall back to item data
                              const productTitle = it.name || product?.title || product?.name || it.title || 'Product';
                              const productBrand = product?.brand || it.brand || '';
                              const productImage = it.image || product?.images?.[0] || product?.image || '/no-image.png';
                              // The price stored in order is the sale price user paid
                              const salePrice = it.price || 0;
                              const quantity = it.quantity || 1;
                              const itemTotal = salePrice * quantity;
                              
                              // Only show discount if product data has pricing info
                              const productMrp = product?.pricing?.mrp;
                              const hasDiscount = productMrp && productMrp > salePrice;
                              
                              return (
                                <div key={idx} className={`flex gap-3 ${idx > 0 ? 'mt-3 pt-3 border-t border-gray-100' : ''}`}>
                                  <ProductImage
                                    src={productImage}
                                    alt={productTitle}
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-gray-900 truncate">
                                      {productTitle}
                                    </h4>
                                    {productBrand && (
                                      <p className="text-xs text-gray-500">{productBrand}</p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                      <span className="text-sm font-semibold text-gray-900">₹{salePrice.toLocaleString('en-IN')}</span>
                                      {hasDiscount && (
                                        <>
                                          <span className="text-xs text-gray-400 line-through">₹{productMrp.toLocaleString('en-IN')}</span>
                                          <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded font-medium">
                                            {Math.round(((productMrp - salePrice) / productMrp) * 100)}% off
                                          </span>
                                        </>
                                      )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      Qty: {quantity}{it.size && ` • Size: ${it.size}`}
                                    </p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-semibold text-gray-900">₹{itemTotal.toLocaleString('en-IN')}</p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Price Details */}
                          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                            <h5 className="text-xs font-semibold text-gray-700 uppercase mb-2">Price Details</h5>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Items Price ({totalItems} item{totalItems > 1 ? 's' : ''})</span>
                                <span className="text-gray-900">₹{itemsPrice.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Tax (5%)</span>
                                <span className="text-gray-900">₹{taxPrice.toLocaleString('en-IN')}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600">Shipping</span>
                                <span className={shippingPrice === 0 ? 'text-green-600' : 'text-gray-900'}>
                                  {shippingPrice === 0 ? 'FREE' : `₹${shippingPrice.toLocaleString('en-IN')}`}
                                </span>
                              </div>
                              {discount > 0 && (
                                <div className="flex justify-between">
                                  <span className="text-green-700 font-medium">
                                    Discount {couponCode && `(${couponCode})`}
                                  </span>
                                  <span className="text-green-600 font-medium">-₹{discount.toLocaleString('en-IN')}</span>
                                </div>
                              )}
                              <div className="border-t border-gray-300 my-2 pt-2">
                                <div className="flex justify-between font-semibold text-base">
                                  <span className="text-gray-900">Total Price</span>
                                  <span className="text-gray-900">₹{totalPrice.toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Order Footer */}
                          <div className="px-4 py-3 bg-white border-t border-gray-200 flex items-center justify-between">
                            <div className="text-xs text-gray-500">
                              Payment: <span className="font-medium text-gray-700">{(order.paymentMethod || 'COD').toUpperCase()}</span>
                              {' • '}
                              Status: <span className="font-medium text-gray-700">{(order.paymentStatus || (order.isPaid ? 'Paid' : 'Pending')).toUpperCase()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Order Total:</span>
                              <span className="text-lg font-bold text-gray-900">₹{totalPrice.toLocaleString('en-IN')}</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-3">
                      <FiShoppingBag className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">No Orders Yet</h3>
                    <p className="text-sm text-gray-500 mb-4">Start shopping to see your orders here</p>
                    <button 
                      onClick={() => navigate('/')} 
                      className="px-5 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
                    >
                      Shop Now
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Order Details Modal */}
            {selectedOrder && (
              <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
                onClick={() => setSelectedOrder(null)}
              >
                <div 
                  className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">
                        Order #{selectedOrder.orderId || String(selectedOrder._id).slice(-8).toUpperCase()}
                      </h2>
                      <p className="text-sm text-gray-500">
                        Placed on {formatDate(selectedOrder.createdAt).date}
                      </p>
                    </div>
                    <button 
                      onClick={() => setSelectedOrder(null)}
                      className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <span className="text-2xl">×</span>
                    </button>
                  </div>

                  <div className="p-6 space-y-6">
                    {/* Order Timeline */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Order Status</h3>
                      <OrderTimeline status={selectedOrder.orderStatus || selectedOrder.status} />
                    </div>

                    {/* Order Items */}
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">
                        Order Items ({selectedOrder.items?.length || 0})
                      </h3>
                      <div className="space-y-3">
                        {selectedOrder.items?.map((item, idx) => {
                          const product = item.product || {};
                          const title = item.name || product?.title || product?.name || 'Product';
                          const image = item.image || product?.images?.[0] || product?.image || '/no-image.png';
                          const price = item.price || 0;
                          const qty = item.quantity || 1;
                          
                          return (
                            <div key={idx} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                              <img 
                                src={image} 
                                alt={title}
                                className="w-16 h-16 object-cover rounded-lg"
                              />
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900">{title}</h4>
                                <p className="text-xs text-gray-500">Qty: {qty}</p>
                                <p className="text-sm font-semibold text-gray-900 mt-1">
                                  ₹{(price * qty).toLocaleString('en-IN')}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Price Details */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Price Details</h3>
                      {(() => {
                        const pd = selectedOrder.priceDetails || {};
                        const itemsTotal = pd.itemsPrice || selectedOrder.items?.reduce((sum, it) => sum + ((it.price || 0) * (it.quantity || 1)), 0) || 0;
                        const tax = pd.taxPrice || Math.round(itemsTotal * 0.05) || 0;
                        const shipping = pd.shippingPrice || (itemsTotal >= 5000 ? 0 : 99) || 0;
                        const disc = pd.discount || 0;
                        const total = pd.totalPrice || (itemsTotal + tax + shipping - disc) || selectedOrder.amount || 0;
                        
                        return (
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Items Price</span>
                              <span className="text-gray-900">₹{itemsTotal.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Tax (5%)</span>
                              <span className="text-gray-900">₹{tax.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Shipping</span>
                              <span className={shipping === 0 ? 'text-green-600' : 'text-gray-900'}>
                                {shipping === 0 ? 'FREE' : `₹${shipping.toLocaleString('en-IN')}`}
                              </span>
                            </div>
                            {disc > 0 && (
                              <div className="flex justify-between">
                                <span className="text-green-700 font-medium">
                                  Discount {pd.couponCode && `(${pd.couponCode})`}
                                </span>
                                <span className="text-green-600 font-medium">-₹{disc.toLocaleString('en-IN')}</span>
                              </div>
                            )}
                            <div className="border-t border-gray-300 pt-2 mt-2">
                              <div className="flex justify-between font-semibold text-base">
                                <span className="text-gray-900">Total</span>
                                <span className="text-gray-900">₹{total.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Shipping Address */}
                    {selectedOrder.shippingAddress && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Shipping Address</h3>
                        <div className="bg-gray-50 rounded-xl p-4 text-sm">
                          <p className="font-medium text-gray-900">{selectedOrder.shippingAddress.fullName}</p>
                          <p className="text-gray-600">{selectedOrder.shippingAddress.address}</p>
                          {selectedOrder.shippingAddress.locality && (
                            <p className="text-gray-600">{selectedOrder.shippingAddress.locality}</p>
                          )}
                          <p className="text-gray-600">
                            {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}
                          </p>
                          <p className="text-gray-600 mt-1">Phone: {selectedOrder.shippingAddress.mobileNumber}</p>
                        </div>
                      </div>
                    )}

                    {/* Payment Info */}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Payment Information</h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Method</p>
                          <p className="font-medium text-gray-900 capitalize">
                            {selectedOrder.paymentMethod || 'COD'}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500">Status</p>
                          <p className="font-medium text-gray-900">
                            {selectedOrder.paymentStatus || (selectedOrder.isPaid ? 'Paid' : 'Pending')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
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
