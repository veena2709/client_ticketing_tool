const StatusBadge = ({ status }) => {
  const styles = {
    open: 'bg-amber-500/20 text-amber-300',
    in_progress: 'bg-blue-500/20 text-blue-300',
    pending: 'bg-purple-500/20 text-purple-300',
    closed: 'bg-emerald-500/20 text-emerald-300'
  };

  return <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${styles[status] || 'bg-slate-600 text-slate-100'}`}>{status}</span>;
};

export default StatusBadge;
