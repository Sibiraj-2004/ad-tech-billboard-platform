/**
 * Footer Component
 */

import { Link } from 'react-router-dom'
import { FaInstagram, FaFacebook, FaTwitter } from 'react-icons/fa'

export default function Footer() {
  return (
    <footer className="bg-surface-900/50 border-t border-surface-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center font-bold text-white text-xs">AT</div>
              <span className="text-lg font-bold font-display gradient-text">Ad-Tech</span>
            </div>
            <p className="text-sm text-surface-400 leading-relaxed">
              The modern platform for digital billboard booking. Connect advertisers with premium outdoor spaces.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <div className="space-y-3">
              <Link to="#" className="flex items-center gap-2 text-sm text-surface-400 hover:text-white transition-all group">
                <FaInstagram className="w-4 h-4 text-surface-500 group-hover:text-primary-400" />
                <span>Instagram</span>
              </Link>
              <Link to="#" className="flex items-center gap-2 text-sm text-surface-400 hover:text-white transition-all group">
                <FaFacebook className="w-4 h-4 text-surface-500 group-hover:text-blue-500" />
                <span>Facebook</span>
              </Link>
              <Link to="#" className="flex items-center gap-2 text-sm text-surface-400 hover:text-white transition-all group">
                <FaTwitter className="w-4 h-4 text-surface-500 group-hover:text-sky-400" />
                <span>Twitter</span>
              </Link>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Company</h4>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-surface-400 hover:text-white transition-colors">About Us</a>
              <a href="#" className="block text-sm text-surface-400 hover:text-white transition-colors">Contact</a>
              <a href="#" className="block text-sm text-surface-400 hover:text-white transition-colors">Careers</a>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4 text-sm uppercase tracking-wider">Legal</h4>
            <div className="space-y-2">
              <a href="#" className="block text-sm text-surface-400 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="block text-sm text-surface-400 hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="block text-sm text-surface-400 hover:text-white transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-surface-800 text-center">
          <p className="text-sm text-surface-500">
            © {new Date().getFullYear()} Ad-Tech. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
