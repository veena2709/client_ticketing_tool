import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { FaMoon, FaSun, FaSignOutAlt, FaUserCircle } from "react-icons/fa";

const navItems = {
  client: [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/tickets/new", label: "Create Ticket" },
  ],
  agent: [
    { to: "/tickets/assigned", label: "Assigned Tickets" },
    { to: "/tickets/unassigned", label: "Unassigned Tickets" },
  ],
  admin: [
    { to: "/dashboard", label: "All Tickets" },
    { to: "/admin/users", label: "Users" },
    { to: "/admin/clients", label: "Clients" },
  ],
};

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { darkMode, setDarkMode } = useTheme();

  return (
    <div className="flex min-h-screen bg-light-bg text-light-text dark:bg-dark-bg dark:text-dark-text transition-colors duration-300">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-light-border bg-light-card p-6 dark:border-dark-border dark:bg-dark-card">
        {/* Logo */}
        <Link to="/dashboard" className="mb-10">
          <h2 className="text-2xl font-bold text-primary">Support Desk</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Enterprise Ticketing
          </p>
        </Link>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-2">
          {(navItems[user?.role] || navItems.client).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-white shadow-md"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="ml-64 flex min-h-screen flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b border-light-border bg-light-card/90 px-8 py-5 backdrop-blur dark:border-dark-border dark:bg-dark-card/90">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Welcome Back 👋
              </p>

              <h1 className="text-2xl font-bold">{user?.name}</h1>
            </div>

            <div className="flex items-center gap-4">
              {/* Theme Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="rounded-xl bg-slate-200 p-3 transition hover:scale-105 dark:bg-slate-700"
              >
                {darkMode ? (
                  <FaSun className="text-yellow-400" />
                ) : (
                  <FaMoon className="text-slate-700" />
                )}
              </button>

              {/* Role Badge */}
              <span className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white capitalize">
                {user?.role}
              </span>

              {/* User Icon */}
              <FaUserCircle className="text-3xl text-primary" />

              {/* Logout */}
              <button
                onClick={logout}
                className="flex items-center gap-2 rounded-xl bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
              >
                <FaSignOutAlt />
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 bg-light-bg p-8 dark:bg-dark-bg">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
