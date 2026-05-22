import { Link, useLocation } from 'react-router-dom';
import { HiHome, HiCube, HiClipboardList, HiUsers, HiChartBar, HiCog } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { ROLES } from '../../utils/constants';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();

  const links = [
    { to: '/dashboard', label: 'Dashboard', icon: HiHome },
    { to: '/billboards', label: 'Browse', icon: HiCube },
  ];

  if (user?.role === ROLES.ADMIN) {
    links.push(
      { to: '/admin', label: 'Overview', icon: HiChartBar },
      { to: '/billboards/create', label: 'Add Billboard', icon: HiCube },
      { to: '/admin/requests', label: 'Booking Requests', icon: HiClipboardList },
      { to: '/admin/invoices', label: 'Invoices', icon: HiChartBar },
      { to: '/admin/users', label: 'Manage Users', icon: HiUsers },
      { to: '/admin/billboards', label: 'Manage Listings', icon: HiCube },
      { to: '/admin/bookings', label: 'Manage Bookings', icon: HiClipboardList },
    );
  }

  if (user?.role === ROLES.ADVERTISER) {
    links.push({ to: '/favorites', label: 'Favorites', icon: HiClipboardList });
    links.push({ to: '/invoices', label: 'Invoices', icon: HiChartBar });
  }

  return (
    <div className="w-64 bg-surface-900 border-r border-surface-800 hidden lg:flex flex-col h-[calc(100vh-64px)] overflow-y-auto">
      <div className="p-4 space-y-2">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-neon'
                  : 'text-surface-400 hover:text-white hover:bg-surface-800'
              }`}
            >
              <link.icon className={`w-5 h-5 ${isActive ? 'text-primary-400' : 'text-surface-400'}`} />
              <span className="font-medium text-sm">{link.label}</span>
            </Link>
          );
        })}
      </div>
      
      <div className="mt-auto p-4 border-t border-surface-800">
        <Link to="/profile" className="flex items-center gap-3 px-4 py-3 text-surface-400 hover:text-white hover:bg-surface-800 rounded-xl transition-all">
          <HiCog className="w-5 h-5" />
          <span className="font-medium text-sm">Settings</span>
        </Link>
      </div>
    </div>
  );
}
