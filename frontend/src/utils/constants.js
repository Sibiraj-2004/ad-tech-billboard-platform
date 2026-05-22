/**
 * Application Constants
 */

export const APP_NAME = 'Ad-Tech'

export const ROLES = {
  ADMIN: 'admin',
  ADVERTISER: 'advertiser', // The Client
}

export const BILLBOARD_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  REJECTED: 'rejected',
}

export const BOOKING_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  COMPLETED: 'completed',
}

export const INVOICE_STATUS = {
  UNPAID: 'unpaid',
  PAID: 'paid',
  OVERDUE: 'overdue',
  CANCELLED: 'cancelled',
}

export const SIZE_TYPES = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'digital', label: 'Digital' },
]

export const STATUS_COLORS = {
  active: 'badge-success',
  confirmed: 'badge-success',
  completed: 'badge-success',
  pending: 'badge-warning',
  inactive: 'badge-info',
  cancelled: 'badge-danger',
  rejected: 'badge-danger',
}

export const POPULAR_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur', 
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal', 'Visakhapatnam', 'Patna', 'Vadodara', 'Coimbatore'
]
