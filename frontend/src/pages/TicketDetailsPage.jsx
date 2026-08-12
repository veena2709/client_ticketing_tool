import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Loader from "../components/Loader";
import StatusBadge from "../components/StatusBadge";
import api from "../services/api";

const TicketDetailsPage = () => {
  const { id } = useParams();

  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTicket = async () => {
      try {
        const response = await api.get(`/tickets/${id}`);

        setTicket(response.data.data.ticket);
        setComments(response.data.data.comments || []);
      } catch (error) {
        console.error("Failed to load ticket:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTicket();
  }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();

    if (!message.trim()) return;

    try {
      await api.post(`/tickets/${id}/reply`, {
        message,
      });

      setMessage("");

      const response = await api.get(`/tickets/${id}`);

      setComments(response.data.data.comments || []);
    } catch (error) {
      console.error("Failed to send reply:", error);
    }
  };

  if (loading) {
    return <Loader />;
  }

  // Backend URL
  const backendUrl = "http://localhost:5000";

  // Attachment URL
  const attachmentUrl = ticket?.attachment_path
    ? `${backendUrl}/uploads/${ticket.attachment_path}`
    : null;

  return (
    <div className="space-y-6">
      {/* ================= TICKET DETAILS ================= */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">
              {ticket?.title}
            </h2>

            <p className="mt-2 text-sm text-slate-400">{ticket?.description}</p>
          </div>

          <StatusBadge status={ticket?.status} />
        </div>
      </div>

      {/* ================= ATTACHMENT ================= */}
      {attachmentUrl && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">Attachment</h3>

          <div className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-950 p-4">
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

      {/* ================= CONVERSATION ================= */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="mb-4 font-semibold text-white">Conversation</h3>

        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-sm text-slate-400">No conversation yet.</p>
          ) : (
            comments.map((comment) => (
              <div
                key={comment.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-3"
              >
                <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                  <span>{comment.name}</span>

                  <span>{new Date(comment.created_at).toLocaleString()}</span>
                </div>

                <p className="text-sm text-slate-200">{comment.message}</p>
              </div>
            ))
          )}
        </div>

        {/* Reply Form */}
        <form onSubmit={handleReply} className="mt-4 space-y-3">
          <textarea
            className="min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500"
            placeholder="Write your reply..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />

          <button
            type="submit"
            className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-700"
          >
            Reply
          </button>
        </form>
      </div>
    </div>
  );
};

export default TicketDetailsPage;
