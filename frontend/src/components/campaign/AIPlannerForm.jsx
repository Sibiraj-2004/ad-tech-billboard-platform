import { useState } from 'react';
import { FaCalculator, FaMapPin, FaCalendarAlt, FaUsers, FaTag } from 'react-icons/fa';

const inputStyle = {
  color: '#010205ff',
  backgroundColor: '#ffffff',
  border: '1px solid #d1d5db',
  borderRadius: '0.5rem',
  padding: '0.5rem 0.75rem',
  width: '100%',
  fontSize: '0.95rem',
};

const placeholderClass = 'placeholder-gray-400';

export default function AIPlannerForm({ onSubmit, loading }) {
  const [formData, setFormData] = useState({
    budget: 2000,
    duration_days: 14,
    location: '',
    category: '',
    target_audience: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'budget' || name === 'duration_days' ? Number(value) : value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-6">
      <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <FaCalculator className="text-indigo-600" /> Plan Your Campaign
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Location */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FaMapPin className="text-gray-400" /> Target Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g. New York, Miami"
              style={inputStyle}
              className={placeholderClass}
              required
            />
          </div>

          {/* Budget */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <span className="text-gray-400 font-bold">$</span> Total Budget
            </label>
            <input
              type="number"
              name="budget"
              value={formData.budget}
              onChange={handleChange}
              min="100"
              step="100"
              style={inputStyle}
              required
            />
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400" /> Duration (Days)
            </label>
            <input
              type="number"
              name="duration_days"
              value={formData.duration_days}
              onChange={handleChange}
              min="1"
              max="90"
              style={inputStyle}
              required
            />
          </div>

          {/* Category */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <FaTag className="text-gray-400" /> Business Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              style={inputStyle}
            >
              <option value="">Any Category</option>
              <option value="retail">Retail</option>
              <option value="food">Food & Beverage</option>
              <option value="tech">Technology</option>
              <option value="real_estate">Real Estate</option>
              <option value="entertainment">Entertainment</option>
            </select>
          </div>
        </div>

        {/* Audience */}
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <FaUsers className="text-gray-400" /> Target Audience Description
          </label>
          <textarea
            name="target_audience"
            value={formData.target_audience}
            onChange={handleChange}
            placeholder="e.g. Young professionals interested in fitness..."
            rows="2"
            style={inputStyle}
            className={placeholderClass}
          ></textarea>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors shadow-lg flex items-center justify-center gap-2 disabled:bg-indigo-400"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Generating Optimized Plan...
            </>
          ) : (
            'Generate AI Plan'
          )}
        </button>
      </form>
    </div>
  );
}
