import { useEffect, useState } from 'react';
import Loader from '../components/Loader';
import api from '../services/api';

const AdminClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await api.get('/admin/clients');
        setClients(response.data.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-4 text-xl font-semibold">Clients</h2>
      <div className="overflow-hidden rounded-2xl border border-slate-800">
        <table className="min-w-full divide-y divide-slate-800 text-sm">
          <thead className="bg-slate-800/70 text-left text-slate-300">
            <tr>
              <th className="px-4 py-3">Organization</th>
              <th className="px-4 py-3">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {clients.map((client) => (
              <tr key={client.id}>
                <td className="px-4 py-3">{client.organization_name}</td>
                <td className="px-4 py-3">{new Date(client.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminClientsPage;
