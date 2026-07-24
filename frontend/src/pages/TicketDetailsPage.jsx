import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';

const TicketDetailsPage = () => {
  const { id } = useParams();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTicket = async () => {
      try {
        const response = await api.get(`/tickets/${id}`);
        setTicket(response.data.data.ticket);
        setComments(response.data.data.comments || []);
      } finally {
        setLoading(false);
      }
    };
    loadTicket();
  }, [id]);

  const handleReply = async (e) => {
    e.preventDefault();
    await api.post(`/tickets/${id}/reply`, { message });
    setMessage('');
    const response = await api.get(`/tickets/${id}`);
    setComments(response.data.data.comments || []);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">{ticket?.title}</h2>
            <p className="text-sm text-slate-400">{ticket?.description}</p>
          </div>
          <StatusBadge status={ticket?.status} />
        </div>
      </div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="mb-4 font-semibold">Conversation</h3>
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3">
              <div className="mb-2 flex items-center justify-between text-sm text-slate-400">
                <span>{comment.name}</span>
                <span>{new Date(comment.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-slate-200">{comment.message}</p>
            </div>
          ))}
        </div>
        <form onSubmit={handleReply} className="mt-4 space-y-3">
          <textarea className="min-h-24 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" value={message} onChange={(e) => setMessage(e.target.value)} />
          <button className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white">Reply</button>
        </form>
      </div>
    </div>
  );
};

export default TicketDetailsPage;
