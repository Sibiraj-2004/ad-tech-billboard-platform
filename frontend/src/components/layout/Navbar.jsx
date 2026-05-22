/**
 * Navbar Component
 * Premium glassmorphism navigation with responsive mobile menu
 */

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { HiMenu, HiX, HiUser, HiLogout, HiHeart, HiViewGrid, HiClipboardList, HiPlusCircle } from 'react-icons/hi'
import { useAuth } from '../../context/AuthContext'
import { ROLES } from '../../utils/constants'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false)
      }
    }

    if (profileOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [profileOpen])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="sticky top-0 z-[110] bg-surface-900/80 backdrop-blur-xl border-b border-surface-700/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to={user?.role === ROLES.ADMIN ? "/admin" : "/dashboard"} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center font-bold text-white text-sm shadow-neon group-hover:shadow-lg transition-shadow">
              AT
            </div>
            <span className="text-xl font-bold font-display gradient-text hidden sm:block">
              Ad-Tech
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            <Link to="/ai-planner" className="px-4 py-2 text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600 hover:opacity-80 transition-opacity flex items-center gap-1">
               ✨ AI Planner
            </Link>
            {isAuthenticated && (
              <>
                {user?.role !== ROLES.ADMIN && (
                  <Link to="/dashboard" className="px-4 py-2 text-sm text-surface-300 hover:text-white rounded-lg hover:bg-surface-800 transition-all">
                    Dashboard
                  </Link>
                )}
                {user?.role === ROLES.ADMIN && (
                  <>
                    <Link to="/admin" className="px-4 py-2 text-sm text-amber-400 hover:text-amber-300 rounded-lg hover:bg-surface-800 transition-all font-semibold">
                      Admin Dashboard
                    </Link>
                    <Link to="/billboards" className="px-4 py-2 text-sm text-surface-300 hover:text-white rounded-lg hover:bg-surface-800 transition-all">
                      Billboards
                    </Link>
                    <Link to="/admin/invoices" className="px-4 py-2 text-sm text-surface-300 hover:text-white rounded-lg hover:bg-surface-800 transition-all">
                      Invoices
                    </Link>
                  </>
                )}
                
                {user?.role === ROLES.ADVERTISER && (
                  <><Link to="/billboards" className="px-4 py-2 text-sm text-surface-300 hover:text-white rounded-lg hover:bg-surface-800 transition-all">
                    Billboards
                    </Link>
                    <Link to="/bookings" className="px-4 py-2 text-sm text-surface-300 hover:text-white rounded-lg hover:bg-surface-800 transition-all">
                      Bookings
                    </Link>
                    <Link to="/invoices" className="px-4 py-2 text-sm text-surface-300 hover:text-white rounded-lg hover:bg-surface-800 transition-all">
                      Invoices
                    </Link>
                    <Link to="/favorites" className="px-4 py-2 text-sm text-surface-300 hover:text-white rounded-lg hover:bg-surface-800 transition-all">
                      Favorites
                    </Link>
                  </>
                )}
                
              </>
            )}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-800 border border-surface-700 hover:border-surface-600 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white text-xs font-bold">
                    {user?.full_name?.[0] || user?.username?.[0] || 'U'}
                  </div>
                  <span className="text-sm text-surface-200 hidden sm:block">{user?.username}</span>
                </button>

                {/* Dropdown */}
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-black glass-card py-2 animate-slide-down">
                    <div className="px-4 py-2 border-b border-surface-700">
                      <p className="text-sm font-medium text-white">{user?.full_name || user?.username}</p>
                      <p className="text-xs text-surface-400">{user?.email}</p>
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-400">
                        {user?.role}
                      </span>
                    </div>
                    <Link to="/profile" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:text-white hover:bg-surface-700/50 transition-colors">
                      <HiUser className="w-4 h-4" /> Profile
                    </Link>
                    <Link to={user?.role === ROLES.ADMIN ? "/admin" : "/dashboard"} onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:text-white hover:bg-surface-700/50 transition-colors">
                      <HiViewGrid className="w-4 h-4" /> Dashboard
                    </Link>
                    {user?.role === ROLES.ADVERTISER && (
                      <>
                        <Link to="/bookings" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:text-white hover:bg-surface-700/50 transition-colors">
                          <HiClipboardList className="w-4 h-4" /> My Bookings
                        </Link>
                        <Link to="/invoices" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:text-white hover:bg-surface-700/50 transition-colors">
                          <HiViewGrid className="w-4 h-4" /> My Invoices
                        </Link>
                        <Link to="/favorites" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:text-white hover:bg-surface-700/50 transition-colors">
                          <HiHeart className="w-4 h-4" /> Favorites
                        </Link>
                      </>
                    )}
                    {user?.role === ROLES.ADMIN && (
                      <>
                        <Link to="/billboards/create" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:text-white hover:bg-surface-700/50 transition-colors">
                          <HiPlusCircle className="w-4 h-4" /> Add Billboard
                        </Link>
                        <Link to="/admin/invoices" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:text-white hover:bg-surface-700/50 transition-colors">
                          <HiClipboardList className="w-4 h-4" /> Invoices
                        </Link>
                        <Link to="/admin/requests" onClick={() => setProfileOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-surface-300 hover:text-white hover:bg-surface-700/50 transition-colors">
                          <HiClipboardList className="w-4 h-4" /> Booking Requests
                        </Link>
                      </>
                    )}
                    <hr className="my-1 border-surface-700" />
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-surface-700/50 transition-colors">
                      <HiLogout className="w-4 h-4" /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="btn-secondary text-sm !px-4 !py-2">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm !px-4 !py-2">Sign Up</Link>
              </div>
            )}

            {/* Mobile menu button */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 text-surface-400 hover:text-white">
              {mobileOpen ? <HiX className="w-6 h-6" /> : <HiMenu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-surface-700/50 animate-slide-down">
            <Link to="/ai-planner" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-purple-400 hover:text-purple-300 hover:bg-surface-800 rounded-lg font-bold">✨ AI Planner</Link>
            <Link to="/billboards" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-surface-300 hover:text-white hover:bg-surface-800 rounded-lg">Billboards</Link>
            {isAuthenticated && (
              <>
                <Link to={user?.role === ROLES.ADMIN ? "/admin" : "/dashboard"} onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-surface-300 hover:text-white hover:bg-surface-800 rounded-lg">Dashboard</Link>
                {user?.role === ROLES.ADVERTISER && (
                  <Link to="/favorites" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-surface-300 hover:text-white hover:bg-surface-800 rounded-lg">Favorites</Link>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
