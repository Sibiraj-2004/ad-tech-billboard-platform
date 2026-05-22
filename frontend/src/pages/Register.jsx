/**
 * Register Page
 */

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import toast from 'react-hot-toast'

export default function Register() {
  const [form, setForm] = useState({
    email: '', username: '', password: '', full_name: '', phone: '', role: 'advertiser',
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setLoading(true)
    const result = await register(form)
    if (result.success) {
      toast.success('Account created! Please verify your email.')
      navigate('/dashboard')
    } else {
      toast.error(result.error)
    }
    setLoading(false)
  }

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="glass-card p-8 animate-scale-in">
          <div className="text-center mb-8">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center font-bold text-white text-xl mb-4 shadow-neon">AT</div>
            <h1 className="text-2xl font-bold font-display text-white">Create Account</h1>
            <p className="text-surface-400 mt-2">Join Ad-Tech and start advertising</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" placeholder="John Doe" value={form.full_name} onChange={update('full_name')} required />
              <Input label="Username" placeholder="johndoe" value={form.username} onChange={update('username')} required />
            </div>

            <Input label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={update('email')} required />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Password" type="password" placeholder="Min 8 characters" value={form.password} onChange={update('password')} required />
              <Input label="Phone (optional)" type="tel" placeholder="+91 98765 43210" value={form.phone} onChange={update('phone')} />
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-surface-300">I want to</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'advertiser', label: 'Book Billboards', desc: 'Advertise my business' },
                  { value: 'admin', label: 'Manage Ads', desc: 'Control the platform' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, role: option.value })}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      form.role === option.value
                        ? 'border-primary-500 bg-primary-500/10 shadow-neon'
                        : 'border-surface-600 bg-surface-800/50 hover:border-surface-500'
                    }`}
                  >
                    <p className="font-medium text-white text-sm">{option.label}</p>
                    <p className="text-xs text-surface-400 mt-1">{option.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <Button type="submit" loading={loading} className="w-full mt-2">
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-surface-400">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-400 hover:text-primary-300 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
