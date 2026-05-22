/**
 * Layout Component — Main app layout with Navbar and Footer
 */

import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

export default function Layout() {
  return (
    <div className="h-full flex flex-col bg-surface-950 overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
        <Footer />
      </main>
    </div>
  )
}
