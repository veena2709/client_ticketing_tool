import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = {
  client: [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/tickets/new', label: 'Create Ticket' }
  ],
  agent: [
    { to: '/dashboard', label: 'Assigned Tickets' },
    { to: '/tickets/unassigned', label: 'Unassigned Tickets' }
  ],
  admin: [
    { to: '/dashboard', label: 'All Tickets' },
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/clients', label: 'Clients' }
  ]
};

const DashboardLayout = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <aside className="fixed left-0 top-0 h-full w-64 border-r border-slate-800 bg-slate-900/95 p-6">
        <div className="mb-8">
          <h2 className="text-xl font-semibold">Support Desk</h2>
          <p className="text-sm text-slate-400">Enterprise ticketing</p>
        </div>
        <nav className="space-y-2">
          {(navItems[user?.role] || navItems.client).map((item) => (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `block rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="ml-64 min-h-screen">
        <header className="border-b border-slate-800 bg-slate-900/80 px-6 py-4 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">Welcome back</p>
              <h1 className="text-lg font-semibold">{user?.name || 'User'}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-slate-800 px-3 py-1 text-sm capitalize text-slate-300">{user?.role}</span>
              <button onClick={logout} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200">Logout</button>
            </div>
          </div>
        </header>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
