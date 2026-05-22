import { useState } from 'react';
import { FaPaperPlane, FaSpinner, FaMapMarkerAlt, FaBullhorn, FaMoneyBillWave, FaRobot, FaListAlt } from 'react-icons/fa';
import api from '../api/client';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import AIPlannerForm from '../components/campaign/AIPlannerForm';

// Fix for default Leaflet marker icons not rendering correctly in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function CampaignPlanner() {
  const [mode, setMode] = useState('form'); // 'form' or 'chat'
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Hi there! I'm your AI Campaign Planner. Tell me about your campaign goals, budget, and target locations, and I'll generate the perfect plan for you.",
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [campaignPlan, setCampaignPlan] = useState(null);

  const handleFormSubmit = async (formData) => {
    setLoading(true);
    setCampaignPlan(null);
    try {
      const response = await api.post('/campaigns/optimize', formData);
      setCampaignPlan(response.data);
      toast.success('Optimized campaign plan generated!');
    } catch (error) {
      console.error(error);
      const detail = error.response?.data?.detail || 'Failed to generate plan';
      toast.error(detail);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text: inputText };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await api.post('/campaigns/chat', { message: userMessage.text });
      
      const { text, campaign_plan } = response.data;

      const aiMessage = { id: Date.now() + 1, sender: 'ai', text };
      setMessages((prev) => [...prev, aiMessage]);

      if (campaign_plan) {
        setCampaignPlan(campaign_plan);
        toast.success('AI updated your campaign plan!');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to get response from AI');
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'ai', text: "Sorry, I'm having trouble connecting right now. Let's try again later!" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <FaBullhorn className="text-indigo-600" /> AI Campaign Planner
          </h1>
          <p className="text-gray-600 mt-2">
            Instantly find the best billboards, optimize your budget, and predict your ROI with our high-tech planner.
          </p>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner inline-flex">
           <button 
             onClick={() => setMode('form')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'form' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
           >
             <FaListAlt /> Form Mode
           </button>
           <button 
             onClick={() => setMode('chat')}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'chat' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
           >
             <FaRobot /> Chat Mode
           </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-auto lg:h-[85vh]">
        {/* ── Control Panel (Form or Chat) ─────────────────────────────── */}
        <div className="lg:w-1/3 flex flex-col h-full">
          {mode === 'form' ? (
            <AIPlannerForm onSubmit={handleFormSubmit} loading={loading} />
          ) : (
            <div className="flex flex-col bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden flex-1">
              <div className="bg-indigo-600 px-6 py-4 flex items-center">
                <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-400"></span>
                  </span>
                  Planner Agent
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[400px]">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 p-3 rounded-2xl rounded-bl-none flex items-center gap-2">
                      <FaSpinner className="animate-spin text-indigo-600" /> Thinking...
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50 flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="E.g., Suggest 3 spots in LA..."
                  className="flex-1 rounded-full border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 px-4 py-2"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-indigo-600 text-white h-10 w-10 rounded-full flex items-center justify-center hover:bg-indigo-700 transition-colors disabled:bg-indigo-400"
                >
                  <FaPaperPlane className="text-sm shadow-sm" />
                </button>
              </form>
            </div>
          )}
        </div>


        {/* ── Map & Plan Visualization ─────────────────────── */}
        <div className="lg:w-2/3 flex flex-col gap-6">
          {/* Map Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 h-1/2 flex flex-col relative overflow-hidden">
             <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-gray-800 flex items-center gap-2">
                 <FaMapMarkerAlt className="text-red-500" /> Interactive Map
               </h3>
               <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md font-medium">Real-time Locations</span>
             </div>
             
             {/* Interactive Map */}
             <div className="flex-1 rounded-lg overflow-hidden group z-0">
               {campaignPlan && campaignPlan.billboards.length > 0 ? (
                 <MapContainer 
                   center={[campaignPlan.billboards[0].latitude, campaignPlan.billboards[0].longitude]} 
                   zoom={12} 
                   scrollWheelZoom={true}
                   style={{ height: "100%", width: "100%" }}
                 >
                   <TileLayer
                     attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                     url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                   />
                   {campaignPlan.billboards.map((b) => (
                     <Marker key={b.billboard_id} position={[b.latitude, b.longitude]}>
                       <Popup>
                         <strong className="text-sm">{b.title}</strong><br/>
                         <span className="text-gray-600">${b.price_per_day}/day | {Math.round(b.roi_score*100)}% ROI</span>
                       </Popup>
                     </Marker>
                   ))}
                 </MapContainer>
               ) : (
                 <div className="w-full h-full bg-gray-100 flex items-center justify-center relative">
                   <div className="absolute inset-0 flex items-center justify-center">
                     <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-lg shadow-md font-medium text-gray-600 z-10">
                       Configure your campaign to see recommended locations
                     </div>
                   </div>
                   <MapContainer 
                     center={[37.7749, -122.4194]} 
                     zoom={10} 
                     scrollWheelZoom={false}
                     zoomControl={false}
                     style={{ height: "100%", width: "100%", opacity: 0.5 }}
                   >
                     <TileLayer
                       url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                     />
                   </MapContainer>
                 </div>
               )}
             </div>

          </div>

          {/* Results Analytics Panel */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 h-1/2 overflow-y-auto">
            <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b flex justify-between items-center">
               <span>Campaign Blueprint</span>
               {campaignPlan && <span className="text-sm font-normal text-green-600 bg-green-50 px-2 py-1 rounded">Optimized for ROI</span>}
            </h3>
            
            {!campaignPlan ? (
               <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center">
                    <FaMoneyBillWave className="text-2xl text-gray-300" />
                  </div>
                  <p>Your AI-generated budget and ROI metrics will appear here.</p>
               </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                    <p className="text-xs text-indigo-600 font-bold uppercase tracking-wide">Total Cost</p>
                    <p className="text-2xl font-bold text-gray-900">${campaignPlan.total_cost.toFixed(2)}</p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                     <p className="text-xs text-blue-600 font-bold uppercase tracking-wide">Budget</p>
                     <p className="text-2xl font-bold text-gray-900">${campaignPlan.budget.toFixed(2)}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                     <p className="text-xs text-green-600 font-bold uppercase tracking-wide">Impressions</p>
                     <p className="text-2xl font-bold text-gray-900">~{(campaignPlan.total_impressions / 1000).toFixed(1)}k</p>
                  </div>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
                     <p className="text-xs text-amber-600 font-bold uppercase tracking-wide">Duration</p>
                     <p className="text-2xl font-bold text-gray-900">{campaignPlan.duration_days} Days</p>
                  </div>
                </div>

                {/* Selected Billboards */}
                <div>
                   <h4 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">Suggested Inventory ({campaignPlan.billboards.length})</h4>
                   <div className="space-y-3">
                     {campaignPlan.billboards.map((b) => (
                       <div key={b.billboard_id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg hover:border-indigo-400 hover:shadow-sm transition-all bg-white relative overflow-hidden">
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                          
                          <div className="ml-2 flex-1">
                             <p className="font-bold text-gray-900">{b.title}</p>
                             <p className="text-xs text-gray-500 truncate mt-1 flex items-center gap-1">
                               <FaMapMarkerAlt className="text-gray-400 text-[10px]" /> {b.city}, {b.state}
                             </p>
                             <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded inline-block mt-2">
                                <span className="font-semibold">AI Note:</span> {b.match_reason}
                             </div>
                          </div>
                          <div className="mt-3 sm:mt-0 text-right shrink-0 ml-4">
                             <p className="font-bold text-indigo-600">${b.price_per_day} <span className="text-xs text-gray-500 font-normal">/ day</span></p>
                             <p className="text-xs font-semibold mt-1">
                               {b.roi_score > 0.8 ? (
                                  <span className="text-green-600 flex items-center justify-end gap-1">
                                    High ROI ({Math.round(b.roi_score * 100)}%)
                                  </span>
                               ) : (
                                  <span className="text-amber-600">{Math.round(b.roi_score * 100)}% Match</span>
                               )}
                             </p>
                          </div>
                       </div>
                     ))}
                   </div>
                </div>

                {/* AI Insights: Demographics & Trends */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
                  {campaignPlan.audience_insights && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h5 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        👥 Audience Demographics
                      </h5>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Gender Split</span>
                          <span className="font-semibold text-gray-800">
                            M: {campaignPlan.audience_insights.gender_split.male}% | F: {campaignPlan.audience_insights.gender_split.female}%
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-500">Top Interests</span>
                          <span className="font-semibold text-gray-800">{campaignPlan.audience_insights.top_interests.join(', ')}</span>
                        </div>
                        <div className="pt-2">
                          <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Age Distribution</p>
                          <div className="flex gap-1 flex-wrap">
                            {campaignPlan.audience_insights.top_age_groups.map(age => (
                              <span key={age} className="px-2 py-1 bg-white border rounded text-[10px] font-medium">{age}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {campaignPlan.location_trends && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <h5 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                        📈 Market Trends
                      </h5>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                           <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{ width: `${campaignPlan.location_trends.demand_index * 100}%` }}></div>
                           </div>
                           <span className="text-xs font-bold text-indigo-600">Demand: {Math.round(campaignPlan.location_trends.demand_index * 100)}%</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                           <div className="p-2 bg-white rounded border">
                              <p className="text-gray-400">Momentum</p>
                              <p className="font-bold text-green-600">↑ Increasing</p>
                           </div>
                           <div className="p-2 bg-white rounded border">
                              <p className="text-gray-400">Peak Season</p>
                              <p className="font-bold text-gray-800">{campaignPlan.location_trends.seasonality_peak}</p>
                           </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

             </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
