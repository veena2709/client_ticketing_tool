import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Input from '../components/Input';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(form.email.trim(), form.password.trim());
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <h1 className="mb-2 text-2xl font-semibold">Welcome back</h1>
        <p className="mb-6 text-sm text-slate-400">Sign in to manage support tickets securely.</p>
        {error && <div className="mb-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-300">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input label="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          <Button className="w-full">Login</Button>
        </form>
        <p className="mt-4 text-sm text-slate-400">
          Need an account? <Link className="text-cyan-400" to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
