import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FaTicketAlt,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaUsers,
  FaBuilding,
  FaUserTie,
  FaTasks,
} from "react-icons/fa";

import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";
import Table from "../components/Table/Table";
import DashboardCard from "../components/DashboardCard";
import api from "../services/api";

const DashboardPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    pendingTickets: 0,
    closedTickets: 0,
    totalUsers: 0,
    totalClients: 0,
    totalAgents: 0,
  });
  const [agentStats, setAgentStats] = useState({
    assignedTickets: 0,
    pendingTickets: 0,
    closedTickets: 0,
  });

  const [clientStats, setClientStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    pendingTickets: 0,
    closedTickets: 0,
  });

  const user = JSON.parse(localStorage.getItem("user"));

  const loadTickets = async (searchText = "") => {
    try {
      let response;

      // Load Tickets
      if (user.role === "agent") {
        response = await api.get(
          `/tickets/assigned?search=${encodeURIComponent(searchText)}`,
        );
        setTickets(response.data.data || []);
      } else {
        // Admin & Client
        response = await api.get(
          `/tickets?search=${encodeURIComponent(searchText)}`,
        );
        setTickets(response.data.data.tickets || []);
      }

      // Admin Dashboard
      if (user.role === "admin") {
        const statsResponse = await api.get("/admin/dashboard");
        setStats(statsResponse.data.data);
      }

      // Agent Dashboard
      if (user.role === "agent") {
        const statsResponse = await api.get("/tickets/dashboard");
        setAgentStats(statsResponse.data.data);
      }

      // Client Dashboard
      if (user.role === "client") {
        const statsResponse = await api.get("/tickets/client-dashboard");
        setClientStats(statsResponse.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadTickets();
  }, []);

  const columns = [
    {
      key: "title",
      label: "Title",
      render: (ticket) => (
        <Link
          className="font-medium text-cyan-400 hover:underline"
          to={`/tickets/${ticket.id}`}
        >
          {ticket.title}
        </Link>
      ),
    },
    {
      key: "priority",
      label: "Priority",
      render: (ticket) => <span className="capitalize">{ticket.priority}</span>,
    },
    {
      key: "status",
      label: "Status",
      render: (ticket) => <StatusBadge status={ticket.status} />,
    },
    {
      key: "organization_name",
      label: "Organization",
      render: (ticket) => ticket.organization_name || "N/A",
    },
  ];

  if (loading) return <Loader />;

  return (
    <div className="space-y-6 bg-slate-100 dark:bg-slate-950 min-h-screen transition-colors duration-300">
      {/* ================= HEADER ================= */}

      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-lg transition-all duration-300 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
              {user.role === "admin"
                ? "Admin Dashboard"
                : user.role === "agent"
                  ? "Agent Dashboard"
                  : "My Dashboard"}
            </h2>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              {user.role === "admin"
                ? "Manage users, clients and tickets from one place."
                : user.role === "agent"
                  ? "Manage your assigned support tickets."
                  : "Track your support requests and create new tickets."}
            </p>
          </div>

          {user.role === "client" && (
            <Link
              to="/tickets/new"
              className="rounded-xl bg-cyan-600 px-6 py-3 font-semibold text-white shadow-md transition hover:bg-cyan-700 hover:shadow-lg"
            >
              + Create Ticket
            </Link>
          )}
        </div>
      </div>

      {/* ================= ADMIN DASHBOARD ================= */}

      {/* ================= ADMIN DASHBOARD ================= */}

      {user.role === "admin" && (
        <div className="space-y-8">
          {/* Ticket Statistics */}
          <div>
            <h3 className="mb-4 text-xl font-semibold text-slate-800 dark:text-white">
              Ticket Overview
            </h3>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardCard
                title="Total Tickets"
                value={stats.totalTickets}
                subtitle="All Tickets"
                icon={<FaTicketAlt />}
                color="bg-gradient-to-r from-cyan-600 to-blue-600"
              />

              <DashboardCard
                title="Open Tickets"
                value={stats.openTickets}
                subtitle="Awaiting Resolution"
                icon={<FaCheckCircle />}
                color="bg-gradient-to-r from-emerald-500 to-green-600"
              />

              <DashboardCard
                title="Pending Tickets"
                value={stats.pendingTickets}
                subtitle="Waiting for Response"
                icon={<FaClock />}
                color="bg-gradient-to-r from-amber-400 to-orange-500"
              />

              <DashboardCard
                title="Closed Tickets"
                value={stats.closedTickets}
                subtitle="Resolved Tickets"
                icon={<FaTimesCircle />}
                color="bg-gradient-to-r from-rose-500 to-red-600"
              />
            </div>
          </div>

          {/* System Statistics */}
          <div>
            <h3 className="mb-4 text-xl font-semibold text-slate-800 dark:text-white">
              System Overview
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <DashboardCard
                title="Users"
                value={stats.totalUsers}
                subtitle="Registered Users"
                icon={<FaUsers />}
                color="bg-gradient-to-r from-violet-600 to-purple-600"
              />

              <DashboardCard
                title="Clients"
                value={stats.totalClients}
                subtitle="Organizations"
                icon={<FaBuilding />}
                color="bg-gradient-to-r from-indigo-600 to-blue-600"
              />

              <DashboardCard
                title="Agents"
                value={stats.totalAgents}
                subtitle="Support Staff"
                icon={<FaUserTie />}
                color="bg-gradient-to-r from-pink-500 to-fuchsia-600"
              />
            </div>
          </div>
        </div>
      )}
      {/* ================= AGENT DASHBOARD ================= */}

      {/* ================= AGENT DASHBOARD ================= */}

      {user.role === "agent" && (
        <div className="space-y-8">
          <div>
            <h3 className="mb-4 text-xl font-semibold text-slate-800 dark:text-white">
              My Work Summary
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <DashboardCard
                title="Assigned Tickets"
                value={agentStats.assignedTickets}
                subtitle="Tickets Assigned To You"
                icon={<FaTasks />}
                color="bg-gradient-to-r from-cyan-600 to-blue-600"
              />

              <DashboardCard
                title="Pending Tickets"
                value={agentStats.pendingTickets}
                subtitle="Waiting For Action"
                icon={<FaClock />}
                color="bg-gradient-to-r from-amber-400 to-orange-500"
              />

              <DashboardCard
                title="Closed Tickets"
                value={agentStats.closedTickets}
                subtitle="Resolved Successfully"
                icon={<FaCheckCircle />}
                color="bg-gradient-to-r from-emerald-500 to-green-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= CLIENT DASHBOARD ================= */}

      {/* ================= CLIENT DASHBOARD ================= */}

      {user.role === "client" && (
        <div className="space-y-8">
          <div>
            <h3 className="mb-4 text-xl font-semibold text-slate-800 dark:text-white">
              My Support Requests
            </h3>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <DashboardCard
                title="My Tickets"
                value={clientStats.totalTickets}
                subtitle="Total Submitted"
                icon={<FaTicketAlt />}
                color="bg-gradient-to-r from-cyan-600 to-blue-600"
              />

              <DashboardCard
                title="Open Tickets"
                value={clientStats.openTickets}
                subtitle="Currently Active"
                icon={<FaCheckCircle />}
                color="bg-gradient-to-r from-emerald-500 to-green-600"
              />

              <DashboardCard
                title="Pending Tickets"
                value={clientStats.pendingTickets}
                subtitle="Waiting For Response"
                icon={<FaClock />}
                color="bg-gradient-to-r from-amber-400 to-orange-500"
              />

              <DashboardCard
                title="Closed Tickets"
                value={clientStats.closedTickets}
                subtitle="Resolved Successfully"
                icon={<FaTimesCircle />}
                color="bg-gradient-to-r from-rose-500 to-red-600"
              />
            </div>
          </div>
        </div>
      )}

      {/* Search */}

      {/* ================= SEARCH ================= */}

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-md transition-colors duration-300 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex flex-col gap-3 md:flex-row">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="🔍 Search tickets by title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  loadTickets(search);
                }
              }}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-5 py-3 text-slate-900 outline-none transition-all duration-300 placeholder:text-slate-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
            />
          </div>

          <button
            onClick={() => loadTickets(search)}
            className="rounded-xl bg-cyan-600 px-8 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:bg-cyan-700 hover:shadow-lg active:scale-95"
          >
            Search
          </button>
        </div>
      </div>

      {/* ================= TICKET TABLE ================= */}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg transition-all duration-300 dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-700">
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
              Support Tickets
            </h3>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Showing {tickets.length} ticket{tickets.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table columns={columns} data={tickets} />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
