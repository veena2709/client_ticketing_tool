const Input = ({ label, error, ...props }) => (
  <label className="block text-sm text-slate-300">
    <span className="mb-1 block">{label}</span>
    <input className={`w-full rounded-lg border bg-slate-900 px-3 py-2 text-white outline-none focus:border-cyan-500 ${error ? 'border-red-500' : 'border-slate-700'}`} {...props} />
    {error && <span className="mt-1 block text-xs text-red-400">{error}</span>}
  </label>
);

export default Input;
