import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../components/Button";
import Input from "../components/Input";
import { useAuth } from "../context/AuthContext";

const SignupPage = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "client",
  });
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // Trim whitespace from inputs
    const trimmedForm = {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password.trim(),
      role: form.role,
    };

    try {
      await signup(trimmedForm);
      navigate("/login");
    } catch (err) {
      console.error("Signup error:", err);
      const errorData = err?.response?.data;

      if (errorData?.error && Array.isArray(errorData.error)) {
        // Handle field validation errors
        const errors = {};
        errorData.error.forEach((err) => {
          errors[err.param] = err.msg;
        });
        setFieldErrors(errors);
        setError("Please fix the errors below");
      } else {
        setError(errorData?.message || err.message || "Signup failed");
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <h1 className="mb-2 text-2xl font-semibold">Create your account</h1>
        <p className="mb-6 text-sm text-slate-400">
          Join the support portal and start filing tickets.
        </p>
        {error && (
          <div className="mb-4 rounded-lg bg-red-500/20 p-3 text-sm text-red-300">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={fieldErrors.name}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={fieldErrors.email}
          />
          <Input
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={fieldErrors.password}
          />
          <label className="block text-sm text-slate-300">
            <span className="mb-1 block">Role</span>
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="client">Client</option>
              <option value="agent">Agent</option>
              <option value="admin">Admin</option>
            </select>
            {fieldErrors.role && (
              <span className="mt-1 block text-xs text-red-400">
                {fieldErrors.role}
              </span>
            )}
          </label>
          <Button className="w-full">Create account</Button>
        </form>
        <p className="mt-4 text-sm text-slate-400">
          Already registered?{" "}
          <Link className="text-cyan-400" to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
