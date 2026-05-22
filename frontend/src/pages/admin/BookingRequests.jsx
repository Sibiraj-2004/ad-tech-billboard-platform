import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { HiCheck, HiX, HiClock, HiCurrencyDollar, HiUser, HiCalendar, HiClipboardList } from 'react-icons/hi'
import { bookingsAPI } from '../../api/bookings'
import { invoicesAPI } from '../../api/invoices'
import { BOOKING_STATUS } from '../../utils/constants'
import { toast } from 'react-hot-toast'
import { PageLoader } from '../../components/common/Spinner'

export default function BookingRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [generatingInvoice, setGeneratingInvoice] = useState(null)

  useEffect(() => {
    fetchRequests()
  }, [])

  const fetchRequests = async () => {
    try {
      const response = await bookingsAPI.listRequests()
      setRequests(response.data.data)
    } catch (error) {
      toast.error('Failed to load booking requests')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (id) => {
    try {
      await bookingsAPI.approve(id)
      toast.success('Booking approved!')
      fetchRequests()
    } catch (error) {
      toast.error('Failed to approve booking')
    }
  }

  const handleReject = async (id) => {
    try {
      await bookingsAPI.reject(id)
      toast.success('Booking rejected')
      fetchRequests()
    } catch (error) {
      toast.error('Failed to reject booking')
    }
  }

  const handleGenerateInvoice = async (booking) => {
    setGeneratingInvoice(booking.id)
    try {
      await invoicesAPI.create({
        booking_id: booking.id,
        amount: booking.total_price,
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        notes: `Invoice for booking ${booking.id}`
      })
      toast.success('Invoice generated successfully!')
      fetchRequests() // Refresh to update status or show invoice icon
    } catch (error) {
      toast.error('Failed to generate invoice')
    } finally {
      setGeneratingInvoice(null)
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-heading">Received <span className="gradient-text">Booking Requests</span></h1>
          <p className="text-surface-400">Review and manage incoming booking applications for your billboards.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <HiClipboardList className="w-12 h-12 text-surface-500 mx-auto mb-4" />
            <p className="text-surface-400">No booking requests received yet.</p>
          </div>
        ) : (
          requests.map((request) => (
            <div key={request.id} className="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center">
                  <HiUser className="w-6 h-6 text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">
                    {request.billboard_title}
                  </h3>
                  {request.billboard_city && (
                    <p className="text-xs text-surface-400">{request.billboard_city}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-surface-400 mt-1">
                    <span className="flex items-center gap-1">
                      <HiCalendar className="w-4 h-4" />
                      {request.start_date} to {request.end_date}
                    </span>
                    <span className="flex items-center gap-1">
                      <HiCurrencyDollar className="w-4 h-4" />
                      ₹{request.total_price}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {request.status === BOOKING_STATUS.PENDING ? (
                  <>
                    <button
                      onClick={() => handleReject(request.id)}
                      className="px-4 py-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-2"
                    >
                      <HiX className="w-4 h-4" /> Reject
                    </button>
                    <button
                      onClick={() => handleApprove(request.id)}
                      className="btn-primary !px-4 !py-2 flex items-center gap-2"
                    >
                      <HiCheck className="w-4 h-4" /> Approve
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${request.status === BOOKING_STATUS.CONFIRMED ? 'bg-green-500/20 text-green-400' :
                        request.status === BOOKING_STATUS.REJECTED ? 'bg-red-500/20 text-red-400' :
                          'bg-surface-700 text-surface-400'
                      }`}>
                      {request.status.toUpperCase()}
                    </span>

                    {request.status === BOOKING_STATUS.CONFIRMED && !request.has_invoice && (
                      <button
                        onClick={() => handleGenerateInvoice(request)}
                        disabled={generatingInvoice === request.id}
                        className="px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors flex items-center gap-2 disabled:opacity-50"
                      >
                        <HiCurrencyDollar className="w-4 h-4" />
                        {generatingInvoice === request.id ? 'Generating...' : 'Generate Invoice'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
