import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";
import Table from "../components/Table/Table";
import api from "../services/api";

const AssignedTicketsPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const loadAssignedTickets = async (searchText = "") => {
    try {
      const response = await api.get(
        `/tickets/assigned?search=${encodeURIComponent(searchText)}`,
      );

      console.log("Assigned Tickets:", response.data);

      setTickets(response.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignedTickets();
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
      key: "attachment_path",
      label: "Attachment",
      render: (ticket) =>
        ticket.attachment_path ? (
          <a
            href={`http://localhost:5000/uploads/${ticket.attachment_path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-green-600 hover:underline"
          >
            📎 View Attachment
          </a>
        ) : (
          <span className="text-slate-400">No attachment</span>
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
      {/* Header */}
      <div
        className="rounded-2xl border border-slate-200 bg-white p-6
                  dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Assigned Tickets
            </h2>

            <p className="text-sm text-slate-600 dark:text-slate-400">
              View all tickets assigned to you.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-3">
        <input
          type="text"
          placeholder="Search assigned tickets..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="
        flex-1 rounded-lg
        border border-slate-300
        bg-white
        px-4 py-2
        text-slate-900
        placeholder-slate-500
        focus:outline-none

        dark:border-slate-700
        dark:bg-slate-900
        dark:text-white
        dark:placeholder-slate-400
      "
        />

        <button
          onClick={() => loadAssignedTickets(search)}
          className="
        rounded-lg
        bg-cyan-600
        px-6 py-2
        text-white
        hover:bg-cyan-700
      "
        >
          Search
        </button>
      </div>

      {/* Tickets Table */}
      <div
        className="
    overflow-hidden rounded-2xl
    border border-slate-200
    bg-white

    dark:border-slate-800
    dark:bg-slate-900
  "
      >
        <Table columns={columns} data={tickets} />
      </div>
    </div>
  );
};

export default AssignedTicketsPage;
