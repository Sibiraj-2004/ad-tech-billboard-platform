import { useState, useEffect } from 'react'
import { HiDocumentText, HiCurrencyDollar, HiClock, HiCheckCircle, HiExclamation } from 'react-icons/hi'
import { invoicesAPI } from '../../api/invoices'
import { INVOICE_STATUS, ROLES } from '../../utils/constants'
import { useAuth } from '../../context/AuthContext'
import { toast } from 'react-hot-toast'
import { PageLoader } from '../../components/common/Spinner'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      const response = await (user?.role === ROLES.ADMIN ? invoicesAPI.listAdmin() : invoicesAPI.listClient())
      setInvoices(response.data.data)
    } catch (error) {
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      await invoicesAPI.updateStatus(id, status)
      toast.success(`Invoice marked as ${status}`)
      fetchInvoices()
    } catch (error) {
      toast.error('Failed to update status')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case INVOICE_STATUS.PAID: return <HiCheckCircle className="text-green-400" />
      case INVOICE_STATUS.OVERDUE: return <HiExclamation className="text-amber-400" />
      case INVOICE_STATUS.CANCELLED: return <HiExclamation className="text-red-400" />
      default: return <HiClock className="text-primary-400" />
    }
  }

  const getStatusClass = (status) => {
    switch (status) {
      case INVOICE_STATUS.PAID: return 'bg-green-500/10 text-green-400'
      case INVOICE_STATUS.OVERDUE: return 'bg-amber-500/10 text-amber-400'
      case INVOICE_STATUS.CANCELLED: return 'bg-red-500/10 text-red-400'
      default: return 'bg-primary-500/10 text-primary-400'
    }
  }

  if (loading) return <PageLoader />

  return (
    <div className="page-container animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="section-heading">Platform <span className="gradient-text">Invoices</span></h1>
          <p className="text-surface-400">Track financial records, issued invoices, and payment statuses.</p>
        </div>
      </div>

      <div className="grid gap-4">
        {invoices.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <HiDocumentText className="w-12 h-12 text-surface-500 mx-auto mb-4" />
            <p className="text-surface-400">No invoices generated yet.</p>
          </div>
        ) : (
          invoices.map((invoice) => (
            <div key={invoice.id} className="glass-card p-5 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center text-primary-400">
                    <HiDocumentText className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-white">{invoice.invoice_number}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusClass(invoice.status)}`}>
                        {invoice.status}
                      </span>
                    </div>
                    <p className="text-sm text-white font-medium mt-1">
                      {invoice.billboard_title}
                    </p>
                    <p className="text-xs text-surface-400">
                      {user?.role === ROLES.ADMIN ? (
                        <>Client: <span className="text-surface-300">{invoice.client_name}</span> ({invoice.client_email})</>
                      ) : (
                        <>Issued by Admin | Due: {new Date(invoice.due_date).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xs text-surface-500 uppercase">Amount</p>
                    <p className="text-lg font-bold text-white">₹{invoice.amount}</p>
                  </div>

                  {invoice.status === INVOICE_STATUS.UNPAID && (
                    <button
                      onClick={() => handleUpdateStatus(invoice.id, 'paid')}
                      className="px-4 py-2 rounded-lg bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-colors text-sm font-medium"
                    >
                      {user?.role === ROLES.ADMIN ? 'Mark as Paid' : 'Pay Invoice'}
                    </button>
                  )}
                </div>
              </div>

              {invoice.notes && (
                <div className="mt-2 p-3 bg-surface-800/40 rounded-lg border border-surface-700/50">
                  <p className="text-xs text-surface-400 italic">
                    <span className="font-bold not-italic mr-1">Notes:</span> 
                    {invoice.notes}
                  </p>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
