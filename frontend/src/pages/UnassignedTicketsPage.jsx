import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";
import Table from "../components/Table/Table";
import api from "../services/api";

const UnassignedTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadUnassignedTickets = async (searchText = "") => {
    try {
      const response = await api.get(
        `/tickets/unassigned?search=${encodeURIComponent(searchText)}`,
      );

      console.log("Unassigned Tickets:", response.data);

      setTickets(response.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUnassignedTickets();
  }, []);

  const columns = [
    {
      key: "title",
      label: "Title",
      render: (ticket) => (
        <Link
          className="font-medium text-cyan-400"
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
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Unassigned Tickets</h2>
            <p className="text-sm text-slate-400">
              View all tickets that are waiting to be assigned.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search unassigned tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-white focus:outline-none"
        />

        <button
          onClick={() => loadUnassignedTickets(search)}
          className="rounded-lg bg-cyan-600 px-6 py-2 text-white"
        >
          Search
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <Table columns={columns} data={tickets} />
      </div>
    </div>
  );
};

export default UnassignedTicketsPage;
