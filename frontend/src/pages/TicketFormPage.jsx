import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import api from '../services/api';

const TicketFormPage = () => {
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tickets', form);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Unable to create ticket');
    }
  };

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-8">
      <h2 className="mb-2 text-2xl font-semibold">Create a support ticket</h2>
      <p className="mb-6 text-sm text-slate-400">Describe your issue clearly so the team can respond quickly.</p>
      {error && <div className="mb-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-300">{error}</div>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <label className="block text-sm text-slate-300">
          <span className="mb-1 block">Description</span>
          <textarea className="min-h-32 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white outline-none focus:border-cyan-500" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </label>
        <label className="block text-sm text-slate-300">
          <span className="mb-1 block">Priority</span>
          <select className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
        <Button className="w-full">Submit ticket</Button>
      </form>
    </div>
  );
};

export default TicketFormPage;
