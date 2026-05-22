/**
 * App.jsx — Root component with routing
 */

import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ScrollToTop from './components/layout/ScrollToTop'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PublicRoute from './components/auth/PublicRoute'

// Pages
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import BillboardListing from './pages/BillboardListing'
import BillboardDetail from './pages/BillboardDetail'
import BookingPage from './pages/BookingPage'
import Favorites from './pages/Favorites'
import Profile from './pages/Profile'
import MyBookings from './pages/MyBookings'
import CreateBillboard from './pages/billboard/CreateBillboard'
import BookingRequests from './pages/admin/BookingRequests'
import Invoices from './pages/admin/Invoices'
import Clients from './pages/admin/Clients'
import NotFound from './pages/NotFound'
import CampaignPlanner from './pages/CampaignPlanner'

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageUsers from './pages/admin/ManageUsers'
import ManageBillboards from './pages/admin/ManageBillboards'
import ManageBookings from './pages/admin/ManageBookings'
import AdminAnalytics from './pages/admin/Analytics'
import AdminLogs from './pages/admin/AdminLogs'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route element={<Layout />}>
        {/* ── Public Routes ──────────────────────────────── */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/billboards" element={<BillboardListing />} />
        <Route path="/billboards/:id" element={<BillboardDetail />} />
        <Route path="/ai-planner" element={<CampaignPlanner />} />

        {/* ── Protected Routes (Any authenticated user) ── */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/favorites" element={<ProtectedRoute><Favorites /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/billboards/:id/book" element={<ProtectedRoute><BookingPage /></ProtectedRoute>} />
        
        {/* ── Admin Listing Routes ─────────────────────── */}
        <Route path="/billboards/create" element={
          <ProtectedRoute roles={['admin']}>
            <CreateBillboard />
          </ProtectedRoute>
        } />

        <Route path="/admin/requests" element={
          <ProtectedRoute roles={['admin']}>
            <BookingRequests />
          </ProtectedRoute>
        } />
        
        <Route path="/admin/invoices" element={
          <ProtectedRoute roles={['admin']}>
            <Invoices />
          </ProtectedRoute>
        } />

        <Route path="/invoices" element={
          <ProtectedRoute roles={['advertiser']}>
            <Invoices />
          </ProtectedRoute>
        } />

        <Route path="/admin/clients" element={
          <ProtectedRoute roles={['admin']}>
            <Clients />
          </ProtectedRoute>
        } />

        {/* ── Admin Routes ───────────────────────────────── */}
        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><ManageUsers /></ProtectedRoute>} />
        <Route path="/admin/billboards" element={<ProtectedRoute roles={['admin']}><ManageBillboards /></ProtectedRoute>} />
        <Route path="/admin/bookings" element={<ProtectedRoute roles={['admin']}><ManageBookings /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>} />
        <Route path="/admin/logs" element={<ProtectedRoute roles={['admin']}><AdminLogs /></ProtectedRoute>} />

        {/* ── 404 ────────────────────────────────────────── */}
        <Route path="*" element={<NotFound />} />
      </Route>
      </Routes>
    </>
  )
}
