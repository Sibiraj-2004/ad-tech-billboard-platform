/**
 * Create Billboard Page
 * Allows admins to list new billboards
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { HiCloudUpload, HiPlus, HiTrash, HiInformationCircle } from 'react-icons/hi'
import { billboardsAPI } from '../../api/billboards'
import { imagesAPI } from '../../api/images'
import { adminAPI } from '../../api/admin'
import { SIZE_TYPES, POPULAR_CITIES } from '../../utils/constants'
import Button from '../../components/common/Button'
import Input from '../../components/common/Input'
import Card from '../../components/common/Card'
import toast from 'react-hot-toast'

export default function CreateBillboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [showCitySuggestions, setShowCitySuggestions] = useState(false)
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false)
  const [categories, setCategories] = useState([
    { id: 'default-1', name: 'Digital Billboard' },
    { id: 'default-2', name: 'Static Billboard' },
    { id: 'default-3', name: 'LED Display' },
    { id: 'default-4', name: 'Bus Shelter' },
    { id: 'default-5', name: 'Street Furniture' },
    { id: 'default-6', name: 'Wall Wrap' }
  ])
  const [categoryName, setCategoryName] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    address: '',
    city: '',
    state: '',
    country: 'India',
    category_id: '',
    size_type: 'medium',
    price_per_day: '',
    price_per_week: '',
    price_per_month: '',
    is_illuminated: false,
    specifications: { resolution: '', aspect_ratio: '', total_slots: '' },
  })
  
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data } = await adminAPI.listCategories()
        const cats = data.data || []
        setCategories(cats)
      } catch (err) {
        toast.error('Failed to load categories')
      }
    }
    loadCategories()
  }, [])

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + selectedFiles.length > 10) {
      toast.error('Maximum 10 images allowed')
      return
    }
    setSelectedFiles(prev => [...prev, ...files])
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Clean up specs - remove empty values
      const cleanSpecs = {}
      if (form.specifications) {
        Object.entries(form.specifications).forEach(([k, v]) => {
          if (v && v.toString().trim()) cleanSpecs[k] = v
        })
      }

      // Validation
      if (form.title.length < 5) {
        toast.error('Title must be at least 5 characters')
        setLoading(false)
        return
      }
      if (form.address.length < 5) {
        toast.error('Street address must be at least 5 characters')
        setLoading(false)
        return
      }
      if (!form.price_per_day || isNaN(parseFloat(form.price_per_day)) || parseFloat(form.price_per_day) <= 0) {
        toast.error('Please enter a valid price per day (> 0)')
        setLoading(false)
        return
      }

      // 1. Create the billboard - clean empty optional fields
      const submitForm = {
        title: form.title,
        description: form.description || null,
        address: form.address,
        city: form.city,
        state: form.state,
        size_type: form.size_type,
        is_illuminated: form.is_illuminated,
        price_per_day: parseFloat(form.price_per_day),
        price_per_week: (form.price_per_week && !isNaN(parseFloat(form.price_per_week))) ? parseFloat(form.price_per_week) : null,
        price_per_month: (form.price_per_month && !isNaN(parseFloat(form.price_per_month))) ? parseFloat(form.price_per_month) : null,
        category_id: (form.category_id && !form.category_id.startsWith('default-')) ? form.category_id : null,
        specifications: Object.keys(cleanSpecs).length > 0 ? cleanSpecs : null,
      }
      
      const { data: billboardRes } = await billboardsAPI.create(submitForm)
      const billboardId = billboardRes.data.id

      // 2. Upload images if any
      if (selectedFiles.length > 0) {
        setUploading(true)
        const formData = new FormData()
        selectedFiles.forEach(file => formData.append('files', file))
        await imagesAPI.upload(billboardId, formData)
        setUploading(false)
      }

      toast.success('Billboard listing is now live!')
      navigate(`/billboards/${billboardId}`)
    } catch (err) {
      console.error('Create error:', err.response?.data)
      const detail = err.response?.data?.detail
      let msg = 'Failed to create billboard'
      
      if (typeof detail === 'string') {
        msg = detail
      } else if (Array.isArray(detail)) {
        msg = detail.map(d => `${d.loc.slice(-1)}: ${d.msg}`).join(', ')
      } else if (err.response?.data?.message) {
        msg = err.response.data.message
      }
      
      toast.error(msg)
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  return (
    <div className="page-container max-w-4xl mx-auto animate-fade-in">
      <div className="mb-8">
        <h1 className="section-heading">Manage <span className="gradient-text">Inventory</span></h1>
        <p className="text-surface-400">Add new billboard spaces directly to the platform.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic Info */}
        <Card className="p-6 space-y-4 relative z-30">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HiInformationCircle className="text-primary-400" /> Basic Information
          </h2>
          <Input 
            label="Billboard Title" 
            placeholder="e.g. Highway LED - Sector 62 Noida" 
            value={form.title} 
            onChange={e => setForm({...form, title: e.target.value})} 
            required 
          />
          <Input 
            label="Description" 
            type="textarea" 
            placeholder="Describe the visibility, traffic, surroundings..." 
            value={form.description} 
            onChange={e => setForm({...form, description: e.target.value})} 
            required 
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-20">
            <div className="space-y-1.5 relative z-[110]">
              <label className="text-sm font-medium text-surface-300">Category</label>
              <input 
                type="text"
                className="input-field" 
                placeholder="Search or select category..."
                value={categoryName}
                onChange={e => {
                  const name = e.target.value;
                  setCategoryName(name);
                  setShowCategorySuggestions(true);
                  const selected = categories.find(c => c.name.toLowerCase() === name.toLowerCase());
                  if (selected) setForm({...form, category_id: selected.id});
                  else setForm({...form, category_id: ''});
                }}
                onFocus={() => setShowCategorySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCategorySuggestions(false), 200)}
                required
              />
              {showCategorySuggestions && (
                <div className="absolute top-full left-0 w-full bg-gray-700 mt-1 glass-card !rounded-xl overflow-hidden py-1 border-surface-600 animate-slide-down max-h-60 overflow-y-auto shadow-2xl">
                  {categories.filter(c => 
                    c.name.toLowerCase().includes(categoryName.toLowerCase())
                  ).length > 0 ? (
                    categories.filter(c => 
                      c.name.toLowerCase().includes(categoryName.toLowerCase())
                    ).map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onMouseDown={() => {
                          setCategoryName(cat.name);
                          setForm({...form, category_id: cat.id});
                          setShowCategorySuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-surface-300 hover:bg-primary-500/20 hover:text-white transition-colors"
                      >
                        {cat.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-xs text-surface-500 italic">No categories found</div>
                  )}
                </div>
              )}
              {!form.category_id && categoryName && (
                <p className="text-[10px] text-red-400 mt-1">Please select a category from the list</p>
              )}
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-surface-300">Size Type</label>
              <select 
                className="input-field" 
                value={form.size_type} 
                onChange={e => setForm({...form, size_type: e.target.value})}
              >
                {SIZE_TYPES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Location */}
        <Card className="p-6 space-y-4 relative z-20">
          <h2 className="text-lg font-bold text-white">Location Details</h2>
          <Input 
            label="Street Address" 
            placeholder="Exact location or landmark" 
            value={form.address} 
            onChange={e => setForm({...form, address: e.target.value})} 
            required 
          />
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5 relative z-[100]">
              <label className="text-sm font-medium text-surface-300">City</label>
              <input 
                type="text"
                className="input-field" 
                placeholder="Search or type city..."
                value={form.city}
                onChange={e => {
                  setForm({...form, city: e.target.value});
                  setShowCitySuggestions(true);
                }}
                onFocus={() => setShowCitySuggestions(true)}
                onBlur={() => setTimeout(() => setShowCitySuggestions(false), 200)}
                required
              />
              {showCitySuggestions && (
                <div className="absolute top-full left-0 w-full bg-gray-700 mt-1 glass-card !rounded-xl overflow-hidden py-1 border-surface-600 animate-slide-down max-h-60 overflow-y-auto shadow-2xl">
                  {POPULAR_CITIES.filter(c => 
                    c.toLowerCase().includes(form.city.toLowerCase())
                  ).length > 0 ? (
                    POPULAR_CITIES.filter(c => 
                      c.toLowerCase().includes(form.city.toLowerCase())
                    ).map(city => (
                      <button
                        key={city}
                        type="button"
                        onMouseDown={() => {
                          setForm({...form, city});
                          setShowCitySuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-surface-300 hover:bg-primary-500/20 hover:text-white transition-colors"
                      >
                        {city}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-2 text-xs text-surface-500 italic">No matches found</div>
                  )}
                </div>
              )}
            </div>
            <Input label="State" value={form.state} onChange={e => setForm({...form, state: e.target.value})} required />
            <div className="flex items-center gap-2 mt-8">
               <input 
                type="checkbox" 
                id="illu" 
                checked={form.is_illuminated} 
                onChange={e => setForm({...form, is_illuminated: e.target.checked})}
                className="w-5 h-5 rounded border-surface-600 bg-surface-700 text-primary-500 focus:ring-primary-500"
              />
              <label htmlFor="illu" className="text-sm text-surface-300">Illuminated / Nightlit</label>
            </div>
          </div>
        </Card>

        {/* Pricing */}
        <Card className="p-6 space-y-4 relative z-10">
          <h2 className="text-lg font-bold text-white">Pricing (INR)</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Price Per Day" type="number" value={form.price_per_day} onChange={e => setForm({...form, price_per_day: e.target.value})} required />
            <Input label="Price Per Week" type="number" placeholder="Optional discount" value={form.price_per_week} onChange={e => setForm({...form, price_per_week: e.target.value})} />
            <Input label="Price Per Month" type="number" placeholder="Optional discount" value={form.price_per_month} onChange={e => setForm({...form, price_per_month: e.target.value})} />
          </div>
        </Card>

        {/* Images */}
        <Card className="p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Photos</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {selectedFiles.map((file, idx) => (
              <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-surface-600">
                <img src={URL.createObjectURL(file)} className="w-full h-full object-cover" />
                <button 
                  type="button" 
                  onClick={() => removeFile(idx)} 
                  className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600 shadow-lg"
                >
                  <HiTrash className="w-3 h-3" />
                </button>
              </div>
            ))}
            {selectedFiles.length < 10 && (
              <label className="aspect-video rounded-lg border-2 border-dashed border-surface-600 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-surface-800 transition-all">
                <HiPlus className="w-6 h-6 text-surface-400" />
                <span className="text-xs text-surface-400 mt-1">Add Photo</span>
                <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
            )}
          </div>
        </Card>

        <div className="flex justify-end gap-3 mt-8">
          <Button variant="secondary" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={loading || uploading}>
            <HiCloudUpload className="w-5 h-5" /> 
            {uploading ? 'Uploading Images...' : 'Create Listing'}
          </Button>
        </div>
      </form>
    </div>
  )
}
