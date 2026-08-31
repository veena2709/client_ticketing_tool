import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const TicketDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);

  // Normal reply
  const [message, setMessage] = useState("");

  // Internal note
  const [internalMessage, setInternalMessage] = useState("");

  // Ticket status
  const [status, setStatus] = useState("");

  // Admin assignment
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState("");

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // =========================================================
  // LOAD TICKET
  // =========================================================

  const loadTicket = async () => {
    try {
      const response = await api.get(`/tickets/${id}`);

      const ticketData = response.data.data.ticket;

      setTicket(ticketData);
      setComments(response.data.data.comments || []);

      setStatus(ticketData.status || "open");
      setSelectedAgent(ticketData.assigned_agent_id || "");
    } catch (error) {
      console.error("Failed to load ticket:", error);

      if (error.response?.status === 403) {
        alert("You are not allowed to view this ticket.");
      } else if (error.response?.status === 404) {
        alert("Ticket not found.");
      }
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // LOAD AGENTS - ADMIN ONLY
  // =========================================================

  const loadAgents = async () => {
    if (user?.role !== "admin") {
      return;
    }

    try {
      const response = await api.get("/admin/users");

      const users = response.data.data || [];

      const agentUsers = users.filter((item) => item.role === "agent");

      setAgents(agentUsers);
    } catch (error) {
      console.error("Failed to load agents:", error);
    }
  };

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    if (!user) return;

    loadTicket();
    loadAgents();
  }, [id, user]);

  // =========================================================
  // CHANGE STATUS - AGENT
  // =========================================================

  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;

    try {
      setActionLoading(true);

      await api.patch(`/tickets/${id}/status`, {
        status: newStatus,
      });

      setStatus(newStatus);

      // Reload ticket so UI stays synchronized with DB
      await loadTicket();

      alert("Ticket status updated successfully.");
    } catch (error) {
      console.error("Failed to update status:", error);

      alert(error.response?.data?.message || "Failed to update ticket status.");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // ASSIGN TICKET - ADMIN
  // =========================================================

  const handleAssign = async () => {
    if (!selectedAgent) {
      alert("Please select an agent.");
      return;
    }

    try {
      setActionLoading(true);

      await api.patch(`/tickets/${id}/assign`, {
        assigned_agent_id: selectedAgent,
      });

      await loadTicket();

      alert("Ticket assigned successfully.");
    } catch (error) {
      console.error("Failed to assign ticket:", error);

      alert(error.response?.data?.message || "Failed to assign ticket.");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // DELETE TICKET - ADMIN
  // =========================================================

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this ticket?",
    );

    if (!confirmed) {
      return;
    }

    try {
      setActionLoading(true);

      await api.delete(`/tickets/${id}`);

      alert("Ticket deleted successfully.");

      navigate("/dashboard");
    } catch (error) {
      console.error("Failed to delete ticket:", error);

      alert(error.response?.data?.message || "Failed to delete ticket.");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // NORMAL REPLY
  // =========================================================

  const handleReply = async (e) => {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    try {
      setActionLoading(true);

      await api.post(`/tickets/${id}/reply`, {
        message: message.trim(),
      });

      setMessage("");

      await loadTicket();
    } catch (error) {
      console.error("Failed to send reply:", error);

      alert(error.response?.data?.message || "Failed to send reply.");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // INTERNAL NOTE
  // =========================================================

  const handleInternalNote = async (e) => {
    e.preventDefault();

    if (!internalMessage.trim()) {
      return;
    }

    try {
      setActionLoading(true);

      await api.post(`/tickets/${id}/internal-note`, {
        message: internalMessage.trim(),
      });

      setInternalMessage("");

      await loadTicket();

      alert("Internal note added successfully.");
    } catch (error) {
      console.error("Failed to add internal note:", error);

      alert(error.response?.data?.message || "Failed to add internal note.");
    } finally {
      setActionLoading(false);
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return <Loader />;
  }

  // =========================================================
  // TICKET NOT FOUND
  // =========================================================

  if (!ticket) {
    return (
      <div className="rounded-2xl border border-red-800 bg-red-950 p-6 text-red-300">
        Ticket not found.
      </div>
    );
  }

  // =========================================================
  // ATTACHMENT URL
  // =========================================================

  const backendUrl = "http://localhost:5000";

  const attachmentUrl = ticket?.attachment_path
    ? `${backendUrl}/uploads/${ticket.attachment_path}`
    : null;

  // =========================================================
  // RETURN UI
  // =========================================================

  return (
    <div className="space-y-6">
      {/* =====================================================
          TICKET DETAILS
      ===================================================== */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Ticket information */}

          <div>
            <h2 className="text-xl font-semibold text-white">{ticket.title}</h2>

            <p className="mt-2 text-sm text-slate-400">{ticket.description}</p>

            <div className="mt-3 text-sm text-slate-400">
              Priority:{" "}
              <span className="font-medium capitalize text-white">
                {ticket.priority}
              </span>
            </div>
          </div>

          {/* Current status */}

          <StatusBadge status={ticket.status} />
        </div>

        {/* =================================================
            AGENT STATUS CONTROL
        ================================================= */}

        {user?.role === "agent" && (
          <div className="mt-6 border-t border-slate-800 pt-6">
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Change Ticket Status
            </label>

            <select
              value={status}
              onChange={handleStatusChange}
              disabled={actionLoading}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500 md:w-64"
            >
              <option value="open">Open</option>

              <option value="pending">Pending</option>

              <option value="closed">Closed</option>
            </select>
          </div>
        )}

        {/* =================================================
            ADMIN CONTROLS
        ================================================= */}

        {user?.role === "admin" && (
          <div className="mt-6 space-y-5 border-t border-slate-800 pt-6">
            {/* ================= ASSIGN AGENT ================= */}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Assign Ticket to Agent
              </label>

              <div className="flex flex-col gap-3 md:flex-row">
                <select
                  value={selectedAgent}
                  onChange={(e) => setSelectedAgent(e.target.value)}
                  disabled={actionLoading}
                  className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500 md:w-80"
                >
                  <option value="">Select Agent</option>

                  {agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name} - {agent.email}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={handleAssign}
                  disabled={actionLoading || !selectedAgent}
                  className="rounded-lg bg-cyan-600 px-5 py-2 font-medium text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {actionLoading ? "Processing..." : "Assign"}
                </button>
              </div>
            </div>

            {/* ================= DELETE ================= */}

            <div className="border-t border-slate-800 pt-5">
              <button
                type="button"
                onClick={handleDelete}
                disabled={actionLoading}
                className="rounded-lg bg-red-600 px-5 py-2 font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : "Delete Ticket"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* =====================================================
          ATTACHMENT
      ===================================================== */}

      {attachmentUrl && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Attachment</h3>

          <div className="flex flex-col gap-4 rounded-xl border border-slate-700 bg-slate-950 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600 text-white">
                📎
              </div>

              <div>
                <p className="text-sm font-medium text-white">
                  {ticket.attachment_path}
                </p>

                <p className="text-xs text-slate-400">Uploaded attachment</p>
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
              >
                View
              </a>

              <a
                href={attachmentUrl}
                download
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Download
              </a>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          CONVERSATION
      ===================================================== */}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="mb-4 font-semibold text-white">Conversation</h3>

        {/* ================= COMMENTS ================= */}

        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-400">No conversation yet.</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className={`rounded-xl border p-3 ${
                  comment.is_internal
                    ? "border-yellow-700 bg-yellow-950/30"
                    : "border-slate-800 bg-slate-950"
                }`}
              >
                <div className="mb-2 flex flex-col gap-1 text-sm text-slate-400 md:flex-row md:items-center md:justify-between">
                  <span>
                    {comment.name}

                    {comment.is_internal && (
                      <span className="ml-2 rounded bg-yellow-600 px-2 py-1 text-xs font-medium text-white">
                        🔒 INTERNAL
                      </span>
                    )}
                  </span>

                  <span>{new Date(comment.created_at).toLocaleString()}</span>
                </div>

                <p className="text-sm text-slate-200">{comment.message}</p>
              </div>
            ))
          )}
        </div>

        {/* =================================================
            INTERNAL NOTE
        ================================================= */}

        {(user?.role === "agent" || user?.role === "admin") && (
          <div className="mt-6 rounded-xl border border-yellow-800 bg-yellow-950/20 p-4">
            <h3 className="mb-2 font-semibold text-yellow-400">
              🔒 Internal Note
            </h3>

            <p className="mb-3 text-sm text-slate-400">
              This note is visible only to support staff. The client will not
              see it.
            </p>

            <form onSubmit={handleInternalNote} className="space-y-3">
              <textarea
                className="min-h-24 w-full rounded-lg border border-yellow-800 bg-slate-950 px-3 py-2 text-white outline-none focus:border-yellow-500"
                placeholder="Write an internal note..."
                value={internalMessage}
                onChange={(e) => setInternalMessage(e.target.value)}
              />

              <button
                type="submit"
                disabled={actionLoading || !internalMessage.trim()}
                className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {actionLoading ? "Adding..." : "Add Internal Note"}
              </button>
            </form>
          </div>
        )}

        {/* =================================================
            NORMAL REPLY
        ================================================= */}

        <form
          onSubmit={handleReply}
          className="mt-6 space-y-3 border-t border-slate-800 pt-6"
        >
          <h3 className="font-semibold text-white">Reply</h3>

          <textarea
            className="min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
            placeholder="Write your reply..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            type="submit"
            disabled={actionLoading || !message.trim()}
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {actionLoading ? "Sending..." : "Reply"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default TicketDetailsPage;
