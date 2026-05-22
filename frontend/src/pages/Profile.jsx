/**
 * Profile Page
 */

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import apiClient from '../api/client'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
  })
  const [pwForm, setPwForm] = useState({ current_password: '', new_password: '' })
  const [saving, setSaving] = useState(false)
  const [changingPw, setChangingPw] = useState(false)

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { data } = await apiClient.patch('/users/me', form)
      updateUser(data.data)
      toast.success('Profile updated')
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
    setSaving(false)
  }

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    if (pwForm.new_password.length < 8) { toast.error('Password must be at least 8 characters'); return }
    setChangingPw(true)
    try {
      await apiClient.patch('/users/me/password', pwForm)
      setPwForm({ current_password: '', new_password: '' })
      toast.success('Password changed')
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    setChangingPw(false)
  }

  return (
    <div className="page-container max-w-2xl mx-auto animate-fade-in">
      <h1 className="section-heading">My <span className="gradient-text">Profile</span></h1>
      <p className="text-surface-400 mb-8">Manage your account settings</p>

      {/* Profile Info */}
      <form onSubmit={handleProfileUpdate} className="glass-card p-6 mb-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Profile Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Email</label>
            <p className="input-field !bg-surface-700/50 text-surface-400 cursor-not-allowed">{user?.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-1.5">Username</label>
            <p className="input-field !bg-surface-700/50 text-surface-400 cursor-not-allowed">{user?.username}</p>
          </div>
        </div>
        <Input label="Full Name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
        <Input label="Phone" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <Button type="submit" loading={saving}>Save Changes</Button>
      </form>

      {/* Change Password */}
      <form onSubmit={handlePasswordChange} className="glass-card p-6 space-y-4">
        <h2 className="text-lg font-bold text-white">Change Password</h2>
        <Input label="Current Password" type="password" value={pwForm.current_password} onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })} required />
        <Input label="New Password" type="password" placeholder="Min 8 characters" value={pwForm.new_password} onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })} required />
        <Button type="submit" loading={changingPw} variant="secondary">Change Password</Button>
      </form>
    </div>
  )
}
