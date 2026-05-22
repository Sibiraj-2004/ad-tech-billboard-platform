import { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';

export default function BookingForm({ billboard, onSubmit, loading }) {
  const [dates, setDates] = useState({ start: '', end: '' });
  
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(dates);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          min={new Date().toISOString().split('T')[0]}
          value={dates.start}
          onChange={(e) => setDates({ ...dates, start: e.target.value })}
          required
        />
        <Input
          label="End Date"
          type="date"
          min={dates.start}
          value={dates.end}
          onChange={(e) => setDates({ ...dates, end: e.target.value })}
          required
        />
      </div>
      <Button type="submit" loading={loading} className="w-full h-14 text-lg">
        Request Booking
      </Button>
    </form>
  );
}
