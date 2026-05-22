import { HiCheckCircle } from 'react-icons/hi';
import { Link } from 'react-router-dom';
import Button from '../common/Button';

export default function BookingConfirmation({ booking }) {
  return (
    <div className="text-center py-10 animate-scale-in">
      <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <HiCheckCircle className="w-12 h-12 text-emerald-500" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-2">Booking Requested!</h2>
      <p className="text-surface-400 max-w-sm mx-auto mb-8">
        Your request for <span className="text-white font-medium">{booking?.billboard_title}</span> has been sent. 
        Go to your dashboard to track its status.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/dashboard">
          <Button variant="primary">Go to Dashboard</Button>
        </Link>
        <Link to="/billboards">
          <Button variant="secondary">Browse More</Button>
        </Link>
      </div>
    </div>
  );
}
