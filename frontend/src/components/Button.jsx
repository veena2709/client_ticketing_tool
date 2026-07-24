const Button = ({ children, className = '', ...props }) => (
  <button
    className={`rounded-lg bg-slate-800 px-4 py-2 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    {...props}
  >
    {children}
  </button>
);

export default Button;
