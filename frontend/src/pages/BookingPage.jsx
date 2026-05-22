/**
 * Booking Page — 3-step checkout with Razorpay payment
 * Step 1: Select dates
 * Step 2: Review summary & choose payment method
 * Step 3: Pay via Razorpay (or pay later with invoice)
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { HiCalendar, HiCurrencyRupee, HiCreditCard, HiCheckCircle, HiShieldCheck } from 'react-icons/hi'
import { billboardsAPI } from '../api/billboards'
import { bookingsAPI } from '../api/bookings'
import { paymentsAPI } from '../api/payments'
import { useAuth } from '../context/AuthContext'
import { formatCurrency } from '../utils/formatters'
import { PageLoader } from '../components/common/Spinner'
import Button from '../components/common/Button'
import Input from '../components/common/Input'
import toast from 'react-hot-toast'

export default function BookingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [billboard, setBillboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ start_date: '', end_date: '', notes: '' })
  const [price, setPrice] = useState(null)
  const [paymentMethod, setPaymentMethod] = useState('pay_later')
  const [bookedRanges, setBookedRanges] = useState([])
  const [dateError, setDateError] = useState('')
  const [step, setStep] = useState('dates') // 'dates' | 'summary' | 'processing'
  const [razorpayEnabled, setRazorpayEnabled] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: bbData }, { data: availData }] = await Promise.all([
          billboardsAPI.getById(id),
          billboardsAPI.getAvailability(id).catch(() => ({ data: { data: { booked_ranges: [] } } }))
        ])
        setBillboard(bbData.data)
        setBookedRanges(availData.data?.booked_ranges || [])

        // Check if Razorpay is configured
        try {
          const { data: configData } = await paymentsAPI.getConfig()
          setRazorpayEnabled(configData.data?.enabled || false)
        } catch { setRazorpayEnabled(false) }
      } catch (err) { toast.error('Billboard not found') }
      setLoading(false)
    }
    load()
  }, [id])

  // Calculate price when dates change
  useEffect(() => {
    if (!billboard || !form.start_date || !form.end_date) { setPrice(null); return }
    const start = new Date(form.start_date)
    const end = new Date(form.end_date)
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24))
    if (days <= 0) { setPrice(null); return }

    let total
    const ppd = parseFloat(billboard.price_per_day)
    const ppw = billboard.price_per_week ? parseFloat(billboard.price_per_week) : null
    const ppm = billboard.price_per_month ? parseFloat(billboard.price_per_month) : null

    if (days >= 30 && ppm) {
      const months = Math.floor(days / 30)
      const rem = days % 30
      total = (ppm * months) + (ppd * rem)
    } else if (days >= 7 && ppw) {
      const weeks = Math.floor(days / 7)
      const rem = days % 7
      total = (ppw * weeks) + (ppd * rem)
    } else {
      total = ppd * days
    }
    setPrice({ days, total: Math.round(total * 100) / 100 })

    // Check for overlap with existing bookings
    const isConflict = bookedRanges.some(r => {
      if (r.status !== 'confirmed') return false
      const bStart = new Date(r.start_date)
      const bEnd = new Date(r.end_date)
      return (start <= bEnd && end >= bStart)
    })
    setDateError(isConflict ? 'These dates overlap with an existing booking.' : '')
  }, [form.start_date, form.end_date, billboard, bookedRanges])

  // Step 1 → Step 2
  const handleReviewSubmit = (e) => {
    e.preventDefault()
    if (!price || price.days <= 0 || dateError) { toast.error('Please select valid dates'); return }
    setStep('summary')
  }

  // Step 2 → Pay or Book
  const handleCheckout = async (e) => {
    e.preventDefault()
    
    if (paymentMethod === 'pay_later') {
      // Direct booking without payment
      await executeBooking()
    } else {
      // Open Razorpay payment
      if (razorpayEnabled) {
        await openRazorpayCheckout()
      } else {
        toast.error('Online payment is not configured yet. Please use "Pay Later" option or contact admin.')
      }
    }
  }

  // Open Razorpay checkout modal
  const openRazorpayCheckout = async () => {
    setSubmitting(true)
    try {
      // 1. Create Razorpay order on backend
      const { data: orderRes } = await paymentsAPI.createOrder({
        billboard_id: id,
        amount: price.total,
      })

      const orderData = orderRes.data

      // 2. Open Razorpay checkout
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'Ad-Tech Platform',
        description: `Booking: ${billboard.title}`,
        order_id: orderData.order_id,
        prefill: {
          name: user?.full_name || user?.username || '',
          email: user?.email || '',
          contact: user?.phone || '',
        },
        theme: {
          color: '#6366f1',
        },
        handler: async function (response) {
          // Payment successful — verify on backend & create booking
          try {
            setStep('processing')
            const { data: verifyRes } = await paymentsAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              billboard_id: id,
              start_date: form.start_date,
              end_date: form.end_date,
              notes: form.notes || null,
            })
            toast.success('Payment successful! Booking confirmed.')
            navigate('/dashboard')
          } catch (err) {
            toast.error('Payment verified but booking failed. Contact support.')
            setStep('summary')
          }
        },
        modal: {
          ondismiss: function () {
            setSubmitting(false)
            toast('Payment cancelled', { icon: '⚠️' })
          }
        }
      }

      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (response) {
        setSubmitting(false)
        toast.error(`Payment failed: ${response.error.description}`)
      })
      rzp.open()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to initiate payment')
      setSubmitting(false)
    }
  }

  // Direct booking (for pay_later)
  const executeBooking = async () => {
    setSubmitting(true)
    try {
      await bookingsAPI.create({
        billboard_id: id,
        start_date: form.start_date,
        end_date: form.end_date,
        notes: form.notes || null,
      })
      toast.success('Booking created! An invoice will be generated.')
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.message || 'Booking failed')
    }
    setSubmitting(false)
  }

  if (loading) return <PageLoader />
  if (!billboard) return <div className="page-container text-center py-20"><p className="text-surface-400">Billboard not found</p></div>

  const today = new Date().toISOString().split('T')[0]

  // Payment method label
  const paymentLabels = {
    pay_later: 'Generate Invoice (Pay Later)',
    debit_card: 'Credit / Debit Card',
    upi: 'UPI',
    gpay: 'Google Pay',
    phonepe: 'PhonePe',
    bank: 'Net Banking',
  }

  return (
    <div className="page-container max-w-2xl mx-auto animate-fade-in">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {['dates', 'summary', 'processing'].map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
              step === s ? 'bg-primary-500 text-white shadow-neon' : 
              ['dates', 'summary', 'processing'].indexOf(step) > i ? 'bg-green-500 text-white' : 'bg-surface-700 text-surface-400'
            }`}>{i + 1}</div>
            <span className={`text-xs hidden sm:inline ${step === s ? 'text-white' : 'text-surface-500'}`}>
              {s === 'dates' ? 'Select Dates' : s === 'summary' ? 'Review & Pay' : 'Confirm'}
            </span>
            {i < 2 && <div className="w-8 h-0.5 bg-surface-700" />}
          </div>
        ))}
      </div>

      <h1 className="section-heading mb-2">Book Billboard</h1>
      <p className="text-surface-400 mb-8">{billboard.title}</p>

      {/* ═══ STEP 1: Date Selection ═══ */}
      {step === 'dates' && (
        <form onSubmit={handleReviewSubmit} className="glass-card p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Start Date" type="date" min={today} value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
            <Input label="End Date" type="date" min={form.start_date || today} value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} required />
          </div>

          {dateError && (
            <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
              ⚠️ {dateError}
            </div>
          )}

          <Input label="Notes (optional)" type="textarea" placeholder="Any special requirements..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          {price && (
            <div className="flex justify-between text-lg font-bold p-4 bg-surface-700/30 rounded-xl">
              <span className="text-white">Estimated Total</span>
              <span className="gradient-text">{formatCurrency(price.total)}</span>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={!price || dateError}>
            <HiCalendar className="w-5 h-5 mr-2" /> Review Booking Details
          </Button>
        </form>
      )}

      {/* ═══ STEP 2: Review & Payment Method ═══ */}
      {step === 'summary' && (
        <form onSubmit={handleCheckout} className="glass-card p-6 space-y-6 animate-slide-up">
          <h2 className="text-xl font-bold text-white mb-4 border-b border-surface-700 pb-2">Booking Summary</h2>
          
          {/* Details Card */}
          <div className="bg-surface-800/50 rounded-xl p-5 border border-surface-700 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Billboard</span>
              <span className="text-white font-medium">{billboard.title}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Location</span>
              <span className="text-white">{billboard.city}, {billboard.state}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Dates</span>
              <span className="text-white">{form.start_date} → {form.end_date}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-surface-700 pt-3">
              <span className="text-surface-400">Duration</span>
              <span className="text-white">{price.days} day{price.days > 1 ? 's' : ''}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-surface-400">Rate</span>
              <span className="text-white">{formatCurrency(billboard.price_per_day)} / day</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-surface-700">
              <span className="text-white">Amount Due</span>
              <span className="gradient-text">{formatCurrency(price.total)}</span>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div>
            <label className="block text-sm font-medium text-surface-300 mb-3">Select Payment Method</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(paymentLabels).map(([key, label]) => (
                <button
                  type="button"
                  key={key}
                  onClick={() => setPaymentMethod(key)}
                  className={`p-3 rounded-xl border text-sm font-medium text-left transition-all ${
                    paymentMethod === key 
                      ? 'border-primary-500 bg-primary-500/10 text-primary-400 shadow-neon' 
                      : 'border-surface-700 bg-surface-800/50 text-surface-300 hover:border-surface-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {key === 'pay_later' && <HiCurrencyRupee className="w-4 h-4" />}
                    {key === 'debit_card' && <HiCreditCard className="w-4 h-4" />}
                    {(key === 'upi' || key === 'gpay' || key === 'phonepe') && <HiShieldCheck className="w-4 h-4" />}
                    {key === 'bank' && <HiCreditCard className="w-4 h-4" />}
                    <span>{label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Info about payment */}
          {paymentMethod !== 'pay_later' && !razorpayEnabled && (
            <div className="text-amber-400 text-sm bg-amber-400/10 p-3 rounded-lg border border-amber-400/20">
              ⚠️ Online payment is not configured. Please set your Razorpay API keys in the .env file or select "Pay Later".
            </div>
          )}

          {paymentMethod !== 'pay_later' && razorpayEnabled && (
            <div className="text-green-400 text-sm bg-green-400/10 p-3 rounded-lg border border-green-400/20 flex items-center gap-2">
              <HiShieldCheck className="w-5 h-5" />
              Secure payment powered by Razorpay. You'll be redirected to the payment gateway.
            </div>
          )}

          <div className="flex gap-3">
            <Button type="button" variant="secondary" className="w-full" onClick={() => setStep('dates')} disabled={submitting}>
              ← Edit Dates
            </Button>
            <Button 
              type="submit" 
              loading={submitting} 
              className="w-full"
              disabled={paymentMethod !== 'pay_later' && !razorpayEnabled}
            >
              {paymentMethod === 'pay_later' ? (
                <><HiCheckCircle className="w-5 h-5 mr-2" /> Confirm Booking</>
              ) : (
                <><HiCreditCard className="w-5 h-5 mr-2" /> Pay {formatCurrency(price.total)}</>
              )}
            </Button>
          </div>
        </form>
      )}

      {/* ═══ STEP 3: Processing ═══ */}
      {step === 'processing' && (
        <div className="glass-card p-8 text-center animate-slide-up">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <HiCheckCircle className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Processing Your Booking...</h2>
          <p className="text-surface-400">Verifying payment and confirming your reservation. Please wait.</p>
        </div>
      )}
    </div>
  )
}
