import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  {
    to: '/customers',
    label: 'Customers',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
  },
];

const adminItems = [
  {
    to: '/sellers',
    label: 'Sellers',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
];

export default function TopNav() {
  const { user, logout } = useAuth();

  return (
    <nav className="w-full bg-dark-900 border-b border-dark-700">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Logo and App Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-400 to-warm-600 flex items-center justify-center shadow-lg shadow-warm-500/25">
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C9 5 7 8 7 11c0 2.5 1.5 4.5 3.5 5.5L9 22h6l-1.5-5.5C15.5 15.5 17 13.5 17 11c0-3-2-6-5-9zm0 4c1.5 2 2.5 4 2.5 5.5 0 1.5-1 2.5-2.5 2.5s-2.5-1-2.5-2.5C9.5 10 10.5 8 12 6z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-white">KeepWarm</h1>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center gap-2 flex-1 justify-center">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-warm-500/10 text-warm-400 border border-warm-500/20'
                      : 'text-dark-400 hover:text-white hover:bg-dark-800'
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}

            {user?.role === 'admin' && (
              <>
                <div className="h-6 w-px bg-dark-700 mx-2" />
                {adminItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-warm-500/10 text-warm-400 border border-warm-500/20'
                          : 'text-dark-400 hover:text-white hover:bg-dark-800'
                      }`
                    }
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                ))}
              </>
            )}
          </div>

          {/* User Info and Logout */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user.name}</p>
                <p className="text-xs text-dark-400">{user.role === 'admin' ? 'Admin' : 'Seller'}</p>
              </div>
            )}
            <button
              onClick={logout}
              className="p-2 text-dark-400 hover:text-white hover:bg-dark-800 rounded-lg transition-colors"
              title="Logout"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

