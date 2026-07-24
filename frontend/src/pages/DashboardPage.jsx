import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import StatusBadge from '../components/StatusBadge';
import api from '../services/api';

const DashboardPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/tickets');
        setTickets(response.data.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Support Tickets</h2>
            <p className="text-sm text-slate-400">Monitor lifecycle, priority, and SLA status from one place.</p>
          </div>
          <Link className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white" to="/tickets/new">Create Ticket</Link>
        </div>
      </div>
      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-800/70 text-left text-slate-300">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Organization</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {tickets.map((ticket) => (
              <tr key={ticket.id} className="hover:bg-slate-800/60">
                <td className="px-4 py-3">
                  <Link className="font-medium text-cyan-400" to={`/tickets/${ticket.id}`}>{ticket.title}</Link>
                </td>
                <td className="px-4 py-3 capitalize">{ticket.priority}</td>
                <td className="px-4 py-3"><StatusBadge status={ticket.status} /></td>
                <td className="px-4 py-3">{ticket.organization_name || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardPage;
